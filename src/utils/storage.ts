import { MotorUnit, Penggadai } from '../types/motor';
import { toISODateString } from './calculations';

// Generate sample seed data relative to current date
export function getInitialSeedData(): MotorUnit[] {
  const now = new Date();

  // Unit 1: Jatuh tempo H-2 (2 Hari Lagi) sesuai tanggal masuk terdaftar
  const dH2 = new Date(now);
  dH2.setMonth(dH2.getMonth() - 1);
  dH2.setDate(now.getDate() + 2);

  // Unit 2: Masuk 12 hari lalu (Aman)
  const d12 = new Date(now);
  d12.setDate(d12.getDate() - 12);

  // Unit 3: Masuk 20 hari lalu (Aman)
  const d20 = new Date(now);
  d20.setDate(d20.getDate() - 20);

  // Unit 4: Overdue / Status Lelang (>90 hari tanpa bayar)
  const d100 = new Date(now);
  d100.setDate(d100.getDate() - 100);

  // Unit 5: Lunas 2 hari lalu
  const dLunasMasuk = new Date(now);
  dLunasMasuk.setDate(dLunasMasuk.getDate() - 25);
  const lunas2DaysAgo = new Date(now);
  lunas2DaysAgo.setDate(lunas2DaysAgo.getDate() - 2);

  return [
    {
      id: 'unit-001',
      no_struk: 'MK-2024-001',
      tanggal_masuk: toISODateString(dH2),
      jenis_motor: 'Honda Vario 160 CBS',
      nama_pemilik: 'BUDI SANTOSO',
      nik: '3171012304850001',
      alamat: 'Jl. Melati No. 12, Kebayoran Baru, Jakarta Selatan',
      no_whatsapp: '081234567890',
      tahun: 2023,
      nopol: 'B 3456 KLT',
      jasa_parkir: 5000,
      nominal_pokok: 3500000,
      pemilik_dana: 'Pribadi',
      pemasukan_detail: [
        {
          id: 'pay-001-1',
          tanggal: toISODateString(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)),
          jumlah: 50000,
          catatan: 'Cicilan jasa parkir minggu 2',
        },
      ],
      status: 'Parkir',
      created_at: dH2.toISOString(),
      updated_at: now.toISOString(),
      catatan: 'BPKB asli dititipkan, kunci kontak 2 pcs.',
    },
    {
      id: 'unit-002',
      no_struk: 'MK-2024-002',
      tanggal_masuk: toISODateString(d12),
      jenis_motor: 'Honda Scoopy Prestige',
      nama_pemilik: 'DEWI LESTARI',
      nik: '3275026708920003',
      alamat: 'Jl. Mawar No. 8B, Bekasi Barat',
      no_whatsapp: '081298765432',
      tahun: 2023,
      nopol: 'B 4821 SYZ',
      jasa_parkir: 5000,
      nominal_pokok: 2800000,
      pemilik_dana: 'Mamah',
      pemasukan_detail: [],
      status: 'Parkir',
      created_at: d12.toISOString(),
      updated_at: now.toISOString(),
      catatan: 'STNK asli dan kunci remote cadangan.',
    },
    {
      id: 'unit-003',
      no_struk: 'MK-2024-003',
      tanggal_masuk: toISODateString(d20),
      jenis_motor: 'Yamaha Aerox 155 VVA',
      nama_pemilik: 'RIAN ARDIANSYAH',
      nik: '3174091501950002',
      alamat: 'Jl. Kemang Timur No. 45, Jakarta Selatan',
      no_whatsapp: '081988776655',
      tahun: 2022,
      nopol: 'B 1289 EFG',
      jasa_parkir: 10000,
      nominal_pokok: 4000000,
      pemilik_dana: 'Pecel',
      pemasukan_detail: [
        {
          id: 'pay-003-1',
          tanggal: toISODateString(new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)),
          jumlah: 100000,
          catatan: 'Titipan jasa parkir tahap 1',
        },
      ],
      status: 'Parkir',
      created_at: d20.toISOString(),
      updated_at: now.toISOString(),
      catatan: 'Kondisi mulus, spion original lengkap.',
    },
    {
      id: 'unit-004',
      no_struk: 'MK-2024-004',
      tanggal_masuk: toISODateString(d100),
      jenis_motor: 'Yamaha NMAX 155 Connected',
      nama_pemilik: 'AGUS SETIAWAN',
      nik: '3273010511880004',
      alamat: 'Jl. Cihampelas No. 102, Bandung',
      no_whatsapp: '085711223344',
      tahun: 2022,
      nopol: 'D 6789 ZX',
      jasa_parkir: 10000,
      nominal_pokok: 5000000,
      pemilik_dana: 'Mamah',
      pemasukan_detail: [],
      status: 'Parkir',
      created_at: d100.toISOString(),
      updated_at: now.toISOString(),
      catatan: 'Pemilik belum bisa dihubungi sejak bulan ke-2.',
    },
    {
      id: 'unit-005',
      no_struk: 'MK-2024-005',
      tanggal_masuk: toISODateString(dLunasMasuk),
      jenis_motor: 'Vespa Sprint 150 i-Get ABS',
      nama_pemilik: 'DONI PRASETYO',
      nik: '3172051806900005',
      alamat: 'Jl. Pluit Raya No. 19, Jakarta Utara',
      no_whatsapp: '081399881122',
      tahun: 2023,
      nopol: 'B 5500 VSP',
      jasa_parkir: 15000,
      nominal_pokok: 7000000,
      pemilik_dana: 'Pribadi',
      pemasukan_detail: [
        {
          id: 'pay-005-1',
          tanggal: toISODateString(lunas2DaysAgo),
          jumlah: 300000,
          catatan: 'Pelunasan seluruh jasa parkir',
        },
      ],
      status: 'Lunas',
      tanggal_lunas: lunas2DaysAgo.toISOString(),
      created_at: dLunasMasuk.toISOString(),
      updated_at: lunas2DaysAgo.toISOString(),
      catatan: 'Sudah ditebus lunas.',
    },
  ];
}

const STORAGE_KEY = 'motorku_data_v1';
const DELETED_IDS_KEY = 'motorku_deleted_ids';
const INITIALIZED_KEY = 'motorku_db_initialized';

// Ambil kumpulan ID unit yang sudah dihapus oleh pengguna
export function getDeletedUnitIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      return new Set(arr.map(String));
    }
  } catch (e) {
    console.warn('Gagal membaca deleted IDs:', e);
  }
  return new Set();
}

// Simpan ID yang dihapus ke localStorage dan bersihkan dari semua storage key
export function markUnitDeletedLocally(unitId: string): void {
  try {
    const deletedSet = getDeletedUnitIds();
    deletedSet.add(unitId);
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(deletedSet)));

    // Bersihkan dari storage utama
    const current = loadUnits();
    const remaining = current.filter((u) => u.id !== unitId);
    saveUnits(remaining);

    // Bersihkan juga dari seluruh storage key alternatif lama agar tidak terungkit kembali
    const alternateKeys = ['motorku_data', 'motorku_backup', 'bisnisku_data', 'units', 'motorku_units'];
    for (const key of alternateKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((item: any) => item && item.id !== unitId);
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        }
      } catch (e) {
        // Abaikan error pada key alternatif
      }
    }
  } catch (err) {
    console.error('Gagal menandai unit dihapus secara lokal:', err);
  }
}

// Sinkronkan kumpulan ID yang dihapus dari Firestore
export function recordDeletedIds(ids: string[]): void {
  try {
    const deletedSet = getDeletedUnitIds();
    let hasChanges = false;
    for (const id of ids) {
      if (!deletedSet.has(id)) {
        deletedSet.add(id);
        hasChanges = true;
      }
    }
    if (hasChanges) {
      localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(deletedSet)));
      // Bersihkan unit yang ada jika ada yang termasuk di kumpulan ID yang dihapus
      const current = loadUnits();
      const cleaned = current.filter((u) => !deletedSet.has(u.id));
      if (cleaned.length !== current.length) {
        saveUnits(cleaned);
      }
    }
  } catch (e) {
    console.warn('Gagal merekam deleted IDs:', e);
  }
}

export function loadUnits(): MotorUnit[] {
  try {
    const deletedSet = getDeletedUnitIds();
    let candidateList: MotorUnit[] = [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          candidateList = parsed.filter((u) => u && u.id && !deletedSet.has(u.id));
        }
      } catch (e) {
        console.warn('Error parsing main storage:', e);
      }
    }

    if (candidateList.length > 0) {
      const updated = candidateList
        .filter((u) => !deletedSet.has(u.id))
        .map((u: any) => {
          const { tanggal_jatuh_tempo, ...rest } = u;
          return {
            ...rest,
            nama_pemilik: (rest.nama_pemilik || '').toUpperCase().trim(),
            nopol: (rest.nopol || '').toUpperCase().trim(),
          };
        });
      return updated;
    }

    // Untuk perangkat baru: kembalikan array kosong agar tidak menimpa data Firestore dengan sampel lokal
    return [];
  } catch (err) {
    console.error('Failed to load Motorku units:', err);
    return [];
  }
}

export function saveUnits(units: MotorUnit[]): void {
  try {
    const deletedSet = getDeletedUnitIds();
    const uppercaseUnits = units
      .filter((u) => !deletedSet.has(u.id))
      .map((u) => ({
        ...u,
        nama_pemilik: (u.nama_pemilik || '').toUpperCase().trim(),
        nopol: (u.nopol || '').toUpperCase().trim(),
      }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uppercaseUnits));
    localStorage.setItem(INITIALIZED_KEY, 'true');
  } catch (err) {
    console.error('Failed to save Motorku units:', err);
  }
}

export function resetToSeedData(): MotorUnit[] {
  const initial = getInitialSeedData();
  saveUnits(initial);
  return initial;
}

const PENGGADAI_STORAGE_KEY = 'motorku_penggadai_v1';

export function getInitialSeedPenggadai(): Penggadai[] {
  return [
    {
      id: 'pgd-3171012304850001',
      nama: 'BUDI SANTOSO',
      nik: '3171012304850001',
      alamat: 'Jl. Melati No. 12, Kebayoran Baru, Jakarta Selatan',
      no_whatsapp: '081234567890',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'pgd-3275026708920003',
      nama: 'DEWI LESTARI',
      nik: '3275026708920003',
      alamat: 'Jl. Mawar No. 8B, Bekasi Barat',
      no_whatsapp: '081298765432',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'pgd-3174091501950002',
      nama: 'RIAN ARDIANSYAH',
      nik: '3174091501950002',
      alamat: 'Jl. Kemang Timur No. 45, Jakarta Selatan',
      no_whatsapp: '081988776655',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'pgd-3273010511880004',
      nama: 'AGUS SETIAWAN',
      nik: '3273010511880004',
      alamat: 'Jl. Cihampelas No. 102, Bandung',
      no_whatsapp: '085711223344',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'pgd-3172051806900005',
      nama: 'DONI PRASETYO',
      nik: '3172051806900005',
      alamat: 'Jl. Pluit Raya No. 19, Jakarta Utara',
      no_whatsapp: '081399881122',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

export function loadPenggadai(): Penggadai[] {
  try {
    const raw = localStorage.getItem(PENGGADAI_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p) => ({
          ...p,
          nama: (p.nama || '').toUpperCase().trim(),
        }));
      }
    }
  } catch (err) {
    console.warn('Gagal membaca data penggadai lokal:', err);
  }
  return [];
}

export function savePenggadai(list: Penggadai[]): void {
  try {
    const cleaned = list.map((p) => ({
      ...p,
      nama: (p.nama || '').toUpperCase().trim(),
    }));
    localStorage.setItem(PENGGADAI_STORAGE_KEY, JSON.stringify(cleaned));
  } catch (err) {
    console.warn('Gagal menyimpan data penggadai lokal:', err);
  }
}
