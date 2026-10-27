export type PemilikDana = 'Pribadi' | 'Mamah' | 'Pecel' | string;

export type UnitStatus = 'Parkir' | 'Lelang' | 'Lunas';

export type KategoriTempo = 'H-0' | 'H-1' | 'H-2' | 'Lewat' | 'Aman' | 'Lunas';

export type TempoFilter = 'semua' | 'H-0' | 'H-1' | 'H-2' | 'lewat';

export interface PaymentEntry {
  id: string;
  tanggal: string; // YYYY-MM-DD
  jumlah: number;
  catatan?: string;
}

export interface MotorUnit {
  id: string;
  no_struk: string;
  tanggal_masuk: string; // YYYY-MM-DD
  jenis_motor: string;
  nama_pemilik: string;
  no_whatsapp: string;
  tahun: number;
  nopol: string;
  jasa_parkir: number; // tarif per hari (e.g. 5000)
  nominal_pokok: number; // pokok uang muka / pinjaman
  pemilik_dana: PemilikDana;
  pemasukan_detail: PaymentEntry[];
  status: UnitStatus;
  tanggal_jatuh_tempo?: string; // YYYY-MM-DD (opsional, jika kosong dihitung otomatis 30 hari dari pembayaran terakhir / masuk)
  status_manual?: boolean;
  tanggal_lunas?: string | null; // ISO timestamp when marked Lunas
  catatan?: string;
  created_at: string;
  updated_at: string;
}

export interface ComputedMotorUnit extends MotorUnit {
  jumlah_hari: number;
  total_jasa_parkir: number;
  total_pemasukan: number;
  jasa_parkir_belum_bayar: number;
  batas_nominal_lelang: number; // 90 * jasa_parkir
  total_penebusan: number;
  hari_tanpa_pemasukan: number;
  is_lelang_otomatis: boolean;
  is_expired_lunas: boolean; // true if lunas > 7 days ago
  display_status: UnitStatus;
  tanggal_jatuh_tempo: string; // YYYY-MM-DD
  sisa_hari_jatuh_tempo: number; // negatif jika sudah lewat
  kategori_tempo: KategoriTempo;
}

export type StatusFilter = 'aktif' | 'semua' | 'Parkir' | 'Lelang' | 'Lunas' | 'arsip_lunas';
