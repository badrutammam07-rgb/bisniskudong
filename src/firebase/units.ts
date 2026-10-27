import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import { MotorUnit } from '../types/motor';
import {
  saveUnits,
  getInitialSeedData,
  getDeletedUnitIds,
  markUnitDeletedLocally,
  recordDeletedIds,
} from '../utils/storage';

const COLLECTION_PATH = 'units';
const DELETED_PATH = 'deleted_units';
const METADATA_PATH = 'metadata';

export type SyncStatus = 'connecting' | 'connected' | 'syncing' | 'error';

/**
 * Pastikan nama pemilik dan nopol selalu HURUF BESAR SEMUA sesuai aturan bisnis
 */
export function sanitizeUnit(unit: MotorUnit): MotorUnit {
  return {
    ...unit,
    nama_pemilik: (unit.nama_pemilik || '').toUpperCase().trim(),
    nopol: (unit.nopol || '').toUpperCase().trim(),
  };
}

/**
 * Mengambil data segar langsung dari Firestore (untuk mobile resume / manual refresh)
 */
export async function forceRefreshUnitsFromFirestore(): Promise<MotorUnit[]> {
  try {
    const deletedSnap = await getDocs(collection(db, DELETED_PATH));
    const deletedIds: string[] = [];
    deletedSnap.forEach((d) => deletedIds.push(d.id));
    if (deletedIds.length > 0) {
      recordDeletedIds(deletedIds);
    }
    const currentDeleted = getDeletedUnitIds();

    const unitsSnap = await getDocs(collection(db, COLLECTION_PATH));
    const remoteUnits: MotorUnit[] = [];
    unitsSnap.forEach((d) => {
      if (!currentDeleted.has(d.id)) {
        remoteUnits.push(sanitizeUnit({ ...(d.data() as MotorUnit), id: d.id }));
      }
    });

    remoteUnits.sort((a, b) => {
      const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
      const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
      return timeB - timeA;
    });

    saveUnits(remoteUnits);
    return remoteUnits;
  } catch (err) {
    console.error('Gagal mengambil data langsung dari Firestore:', err);
    try {
      handleFirestoreError(err, OperationType.LIST, COLLECTION_PATH);
    } catch {
      // rethrow formatted error
    }
    throw err;
  }
}

/**
 * Berlangganan (real-time sync) ke Firestore:
 * - Data selalu sinkron di perangkat manapun yang membuka link
 * - Perubahan di satu HP/laptop langsung muncul seketika di HP/laptop lain
 */
export function subscribeUnits(
  onData: (units: MotorUnit[]) => void,
  onError?: (err: unknown) => void,
  onStatusChange?: (status: SyncStatus) => void
): Unsubscribe {
  const unitsRef = collection(db, COLLECTION_PATH);
  const deletedRef = collection(db, DELETED_PATH);

  let currentDeletedIds = getDeletedUnitIds();
  onStatusChange?.('connecting');

  // 1. Dengarkan daftar unit yang telah dihapus di Firestore
  const unsubDeleted = onSnapshot(
    deletedRef,
    (snapshot) => {
      const deletedIdsFromRemote: string[] = [];
      snapshot.forEach((d) => {
        deletedIdsFromRemote.push(d.id);
      });
      if (deletedIdsFromRemote.length > 0) {
        recordDeletedIds(deletedIdsFromRemote);
        currentDeletedIds = getDeletedUnitIds();
      }
    },
    (err) => {
      console.warn('Gagal sinkronisasi data deleted_units:', err);
    }
  );

  // 2. Dengarkan data unit aktif di Firestore
  const unsubUnits = onSnapshot(
    unitsRef,
    async (snapshot) => {
      onStatusChange?.('syncing');
      currentDeletedIds = getDeletedUnitIds();

      // Periksa apakah database remote sudah pernah diinisialisasi
      let isDbInitialized = false;
      try {
        const metaSnap = await getDoc(doc(db, METADATA_PATH, 'app_state'));
        if (metaSnap.exists() && metaSnap.data()?.initialized) {
          isDbInitialized = true;
          localStorage.setItem('motorku_db_initialized', 'true');
        }
      } catch {
        // Mode offline atau fallback
        isDbInitialized = localStorage.getItem('motorku_db_initialized') === 'true';
      }

      // Kasus A: Koleksi units di Firestore kosong
      if (snapshot.empty) {
        // Jika database sudah pernah diinisialisasi atau sudah ada record deleted_units,
        // berarti user sengaja menghapus semua unit! JANGAN re-seed data sample!
        if (isDbInitialized || currentDeletedIds.size > 0) {
          saveUnits([]);
          onData([]);
          onStatusChange?.('connected');
          return;
        }

        // HANYA jika database benar-benar perawan (pertama kali dibuka di dunia),
        // isi dengan data sample awal satu kali saja di cloud
        console.log('Inisialisasi database Firestore pertama kali...');
        const initial = getInitialSeedData()
          .filter((item) => !currentDeletedIds.has(item.id))
          .map(sanitizeUnit);

        for (const item of initial) {
          try {
            await setDoc(doc(db, COLLECTION_PATH, item.id), item);
          } catch (e) {
            console.error('Gagal menulis data ke Firestore:', e);
          }
        }

        try {
          await setDoc(doc(db, METADATA_PATH, 'app_state'), { initialized: true }, { merge: true });
          localStorage.setItem('motorku_db_initialized', 'true');
        } catch {
          // Abaikan
        }

        saveUnits(initial);
        onData(initial);
        onStatusChange?.('connected');
        return;
      }

      // Kasus B: Ada dokumen di Firestore
      const remoteUnits: MotorUnit[] = [];
      for (const d of snapshot.docs) {
        const id = d.id;
        // Jika ID ada di daftar terhapus, hapus permanen dari Firestore
        if (currentDeletedIds.has(id)) {
          deleteDoc(doc(db, COLLECTION_PATH, id)).catch((err) => {
            console.warn(`Pembersihan unit terhapus (${id}) gagal:`, err);
          });
          continue;
        }

        const data = d.data() as MotorUnit;
        remoteUnits.push(sanitizeUnit({ ...data, id }));
      }

      // Tandai database remote sudah diinisialisasi
      localStorage.setItem('motorku_db_initialized', 'true');

      // Urutkan berdasarkan waktu update terbaru
      remoteUnits.sort((a, b) => {
        const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
        const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
        return timeB - timeA;
      });

      // Simpan salinan offline ke localStorage perangkat ini
      saveUnits(remoteUnits);
      onData(remoteUnits);
      onStatusChange?.('connected');
    },
    (error) => {
      onStatusChange?.('error');
      try {
        handleFirestoreError(error, OperationType.LIST, COLLECTION_PATH);
      } catch (err) {
        if (onError) onError(err);
      }
    }
  );

  return () => {
    unsubDeleted();
    unsubUnits();
  };
}

/**
 * Tambah unit baru ke Firestore (tersinkron ke seluruh perangkat secara realtime)
 */
export async function addUnitToFirestore(unit: MotorUnit): Promise<void> {
  const clean = sanitizeUnit(unit);
  const docRef = doc(db, COLLECTION_PATH, clean.id);
  try {
    await setDoc(docRef, clean);
    await setDoc(doc(db, METADATA_PATH, 'app_state'), { initialized: true }, { merge: true });
    localStorage.setItem('motorku_db_initialized', 'true');
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTION_PATH}/${clean.id}`);
    throw error;
  }
}

/**
 * Update data unit di Firestore (tersinkron ke seluruh perangkat secara realtime)
 */
export async function updateUnitInFirestore(unit: MotorUnit): Promise<void> {
  const clean = sanitizeUnit(unit);
  const docRef = doc(db, COLLECTION_PATH, clean.id);
  try {
    await setDoc(docRef, clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_PATH}/${clean.id}`);
    throw error;
  }
}

/**
 * Hapus data unit dari Firestore secara PERMANEN:
 * 1. Catat ke tombstone 'deleted_units' agar semua perangkat langsung menghapus unit ini
 * 2. Hapus dokumen fisik dari 'units'
 * 3. Bersihkan penyimpanan lokal
 */
export async function deleteUnitFromFirestore(unitId: string): Promise<void> {
  markUnitDeletedLocally(unitId);

  // 1. Catat tombstone di deleted_units agar perangkat lain dan reload tidak membangkitkan data ini kembali
  try {
    await setDoc(doc(db, DELETED_PATH, unitId), {
      id: unitId,
      deleted_at: new Date().toISOString(),
    });
    await setDoc(doc(db, METADATA_PATH, 'app_state'), { initialized: true }, { merge: true });
  } catch (error) {
    console.warn('Gagal mencatat ID unit ke deleted_units Firestore:', error);
  }

  // 2. Hapus dokumen fisik dari Firestore
  const docRef = doc(db, COLLECTION_PATH, unitId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_PATH}/${unitId}`);
    throw error;
  }
}

/**
 * Batch update / restore semua unit ke Firestore
 */
export async function syncAllUnitsToFirestore(units: MotorUnit[]): Promise<void> {
  const deletedSet = getDeletedUnitIds();
  for (const u of units) {
    if (!deletedSet.has(u.id)) {
      const clean = sanitizeUnit(u);
      await setDoc(doc(db, COLLECTION_PATH, clean.id), clean);
    }
  }
}
