import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import { Penggadai } from '../types/motor';
import { savePenggadai, getInitialSeedPenggadai } from '../utils/storage';

const PENGGADAI_COLLECTION = 'penggadai';

/**
 * Standardize Penggadai (nama uppercase)
 */
export function sanitizePenggadai(p: Penggadai): Penggadai {
  const nikClean = (p.nik || '').trim();
  const idClean = p.id || (nikClean ? `pgd-${nikClean}` : `pgd-${Date.now()}`);
  return {
    ...p,
    id: idClean,
    nama: (p.nama || '').toUpperCase().trim(),
    nik: nikClean,
    alamat: (p.alamat || '').trim(),
    no_whatsapp: (p.no_whatsapp || '').trim(),
    updated_at: p.updated_at || new Date().toISOString(),
    created_at: p.created_at || new Date().toISOString(),
  };
}

/**
 * Real-time listener untuk koleksi master Penggadai di Firestore.
 * Penggadai yang tersimpan di sini TETAP AMAN dan TIDAK PERNAH DIHAPUS
 * meskipun unit motor nasabah tersebut sudah lunas atau dihapus.
 */
export function subscribePenggadai(
  onData: (penggadaiList: Penggadai[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const penggadaiRef = collection(db, PENGGADAI_COLLECTION);

  return onSnapshot(
    penggadaiRef,
    async (snapshot) => {
      // Jika koleksi di Firestore masih kosong pertama kali, seed dari master awal
      if (snapshot.empty) {
        const seedList = getInitialSeedPenggadai().map(sanitizePenggadai);
        for (const item of seedList) {
          try {
            await setDoc(doc(db, PENGGADAI_COLLECTION, item.id), item, { merge: true });
          } catch (e) {
            console.warn('Gagal seed penggadai awal:', e);
          }
        }
        savePenggadai(seedList);
        onData(seedList);
        return;
      }

      const list: Penggadai[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as Penggadai;
        list.push(sanitizePenggadai({ ...data, id: d.id }));
      });

      // Urutkan berdasarkan abjad nama
      list.sort((a, b) => a.nama.localeCompare(b.nama));

      savePenggadai(list);
      onData(list);
    },
    (error) => {
      console.warn('Gagal mendengarkan koleksi penggadai:', error);
      try {
        handleFirestoreError(error, OperationType.LIST, PENGGADAI_COLLECTION);
      } catch (err) {
        if (onError) onError(err);
      }
    }
  );
}

/**
 * Tambah atau perbarui data master Penggadai di Firestore.
 * Menggunakan NIK sebagai kunci ID unik (atau format pgd-{nik}) agar tidak duplikat.
 */
export async function upsertPenggadaiToFirestore(p: Partial<Penggadai> & { nama: string }): Promise<Penggadai> {
  const nikClean = (p.nik || '').replace(/\D/g, '').trim();
  const docId = p.id || (nikClean ? `pgd-${nikClean}` : `pgd-${Date.now()}`);

  const fullPenggadai: Penggadai = sanitizePenggadai({
    id: docId,
    nama: p.nama,
    nik: p.nik || '',
    alamat: p.alamat || '',
    no_whatsapp: p.no_whatsapp || '',
    created_at: p.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  try {
    await setDoc(doc(db, PENGGADAI_COLLECTION, fullPenggadai.id), fullPenggadai, { merge: true });
    return fullPenggadai;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${PENGGADAI_COLLECTION}/${fullPenggadai.id}`);
    throw err;
  }
}

/**
 * Ambil daftar penggadai langsung dari Firestore (one-time fetch)
 */
export async function fetchPenggadaiDirect(): Promise<Penggadai[]> {
  try {
    const snap = await getDocs(collection(db, PENGGADAI_COLLECTION));
    const list: Penggadai[] = [];
    snap.forEach((d) => {
      list.push(sanitizePenggadai({ ...(d.data() as Penggadai), id: d.id }));
    });
    list.sort((a, b) => a.nama.localeCompare(b.nama));
    savePenggadai(list);
    return list;
  } catch (err) {
    console.warn('Gagal mengambil penggadai langsung:', err);
    return [];
  }
}
