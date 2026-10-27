import { MotorUnit, ComputedMotorUnit, UnitStatus, KategoriTempo } from '../types/motor';

/**
 * Format currency to Indonesian Rupiah standard (Rp X.XXX.XXX)
 */
export function formatRupiah(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format nominal input secara otomatis dengan titik sebelum 3 angka terakhir (pemisah ribuan)
 * Contoh: 3000000 -> "3.000.000", 5000 -> "5.000"
 */
export function formatNominalInput(value: string | number): string {
  if (value === '' || value === null || value === undefined) return '';
  const digitsOnly = String(value).replace(/\D/g, '');
  if (!digitsOnly) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(digitsOnly, 10));
}

/**
 * Ubah string nominal berformat titik kembali menjadi number murni
 * Contoh: "3.000.000" -> 3000000
 */
export function parseNominalInput(value: string | number): number {
  if (value === '' || value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const digitsOnly = value.replace(/\D/g, '');
  return digitsOnly ? parseInt(digitsOnly, 10) : 0;
}

/**
 * Format date string (YYYY-MM-DD) to friendly Indonesian date
 */
export function formatDateIndo(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
    }
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Get midnight Date object from YYYY-MM-DD or ISO string
 */
export function toMidnight(dateStr: string): Date {
  const parts = dateStr.slice(0, 10).split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Format Date to YYYY-MM-DD
 */
export function toISODateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Hitung jumlah hari dari tanggal masuk sampai saat ini (atau sampai tanggal lunas).
 * Sesuai aturan: "tetap dihitung satu sampai saat ini"
 * Misal masuk hari ini = 1 hari, kemarin = 2 hari.
 */
export function calculateDays(tanggalMasukStr: string, tanggalLunasStr?: string | null): number {
  if (!tanggalMasukStr) return 1;
  const masukDate = toMidnight(tanggalMasukStr);
  
  let targetDate = new Date();
  targetDate.setHours(0, 0, 0, 0);

  // Jika sudah lunas, hitung hari sampai tanggal lunas agar tagihan berhenti berjalan
  if (tanggalLunasStr) {
    targetDate = toMidnight(tanggalLunasStr);
  }

  const diffTime = targetDate.getTime() - masukDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(1, diffDays + 1);
}

/**
 * Hitung berapa hari tanpa pemasukan:
 * Dihitung dari tanggal pembayaran terakhir. Jika belum pernah ada pemasukan,
 * dihitung dari tanggal masuk.
 */
export function calculateDaysWithoutPayment(unit: MotorUnit): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let lastActiveDateStr = unit.tanggal_masuk;

  if (unit.pemasukan_detail && unit.pemasukan_detail.length > 0) {
    const sortedPayments = [...unit.pemasukan_detail].sort((a, b) => {
      return new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
    });
    if (sortedPayments[0]?.tanggal) {
      lastActiveDateStr = sortedPayments[0].tanggal;
    }
  }

  const lastDate = toMidnight(lastActiveDateStr);
  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Cek apakah status lunas sudah melewati 1 minggu (7 hari)
 */
export function isLunasExpired(unit: MotorUnit): boolean {
  if (unit.status !== 'Lunas' || !unit.tanggal_lunas) {
    return false;
  }
  const lunasTime = new Date(unit.tanggal_lunas).getTime();
  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  return (now - lunasTime) >= SEVEN_DAYS_MS;
}

/**
 * Menghitung tanggal jatuh tempo unit secara otomatis berdasarkan tanggal masuk:
 * - Tidak ada penginputan tanggal jatuh tempo manual.
 * - Tanggal jatuh tempo berulang setiap bulan pada tanggal yang sama dengan tanggal masuk.
 * - Notifikasi hanya mengingatkan untuk unit yang H-2 sebelum tanggal tersebut.
 */
export function calculateCycleDueDate(
  tanggalMasukStr: string,
  refDate: Date = new Date()
): { dueDateStr: string; sisaHari: number } {
  if (!tanggalMasukStr) {
    const fallback = toISODateString(refDate);
    return { dueDateStr: fallback, sisaHari: 0 };
  }

  const masuk = toMidnight(tanggalMasukStr);
  const targetDay = masuk.getDate();

  const today = new Date(refDate);
  today.setHours(0, 0, 0, 0);

  const curYear = today.getFullYear();
  const curMonth = today.getMonth();

  // Helper untuk membuat tanggal valid dengan batasan hari maksimal dalam bulan (misal 28/30/31)
  const getCycleDate = (year: number, month: number): Date => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const clampedDay = Math.min(targetDay, daysInMonth);
    return new Date(year, month, clampedDay, 0, 0, 0, 0);
  };

  // Siklus bulan ini
  const thisMonthCycle = getCycleDate(curYear, curMonth);

  // Jika unit baru masuk di bulan ini pada atau setelah siklus bulan ini,
  // maka jatuh tempo pertamanya adalah bulan depan
  if (masuk.getTime() >= thisMonthCycle.getTime()) {
    const nextMonthCycle = getCycleDate(curYear, curMonth + 1);
    const sisa = Math.round((nextMonthCycle.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return {
      dueDateStr: toISODateString(nextMonthCycle),
      sisaHari: sisa,
    };
  }

  // Unit masuk di bulan sebelumnya.
  // Hitung selisih hari menuju siklus bulan ini:
  const diffDaysThisMonth = Math.round((thisMonthCycle.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Jika siklus bulan ini belum lewat (H-2, H-1, H-0, atau masih beberapa hari ke depan):
  if (diffDaysThisMonth >= 0) {
    return {
      dueDateStr: toISODateString(thisMonthCycle),
      sisaHari: diffDaysThisMonth,
    };
  }

  // Jika siklus bulan ini sudah lewat (diffDaysThisMonth < 0):
  // Cek siklus bulan berikutnya:
  const nextMonthCycle = getCycleDate(curYear, curMonth + 1);
  const diffDaysNextMonth = Math.round((nextMonthCycle.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Jika siklus bulan depan sudah mendekati H-2 (misal sisa 2 hari):
  if (diffDaysNextMonth <= 2) {
    return {
      dueDateStr: toISODateString(nextMonthCycle),
      sisaHari: diffDaysNextMonth,
    };
  }

  // Jika belum mendekati siklus baru, status unit adalah Lewat Tempo dari siklus bulan ini
  return {
    dueDateStr: toISODateString(thisMonthCycle),
    sisaHari: diffDaysThisMonth,
  };
}

export function calculateDueDate(unit: MotorUnit): string {
  const { dueDateStr } = calculateCycleDueDate(unit.tanggal_masuk);
  return dueDateStr;
}

export function calculateDaysUntilDue(dueDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = toMidnight(dueDateStr);
  const diffTime = dueDate.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function getTempoCategory(sisaHari: number, status: UnitStatus): KategoriTempo {
  if (status === 'Lunas') return 'Lunas';
  if (sisaHari === 2) return 'H-2';
  if (sisaHari === 1) return 'H-1';
  if (sisaHari === 0) return 'H-0';
  if (sisaHari < 0) return 'Lewat';
  return 'Aman';
}

/**
 * Hitung semua nilai komputasi untuk unit motor
 */
export function computeUnit(unit: MotorUnit): ComputedMotorUnit {
  const jumlah_hari = calculateDays(unit.tanggal_masuk, unit.status === 'Lunas' ? unit.tanggal_lunas : null);
  const total_jasa_parkir = jumlah_hari * (unit.jasa_parkir || 0);

  const total_pemasukan = (unit.pemasukan_detail || []).reduce(
    (sum, p) => sum + (Number(p.jumlah) || 0),
    0
  );

  const jasa_parkir_belum_bayar = Math.max(0, total_jasa_parkir - total_pemasukan);
  const nominal_pokok = Number(unit.nominal_pokok) || 0;
  const total_penebusan = nominal_pokok + jasa_parkir_belum_bayar;

  const hari_tanpa_pemasukan = calculateDaysWithoutPayment(unit);

  // Aturan status lelang & parkir:
  // "jika nominal total jasa parkir yang belum dibayarkan sudah melebihi total (90 hari x jasa parkir harian) maka status berubah jadi LELANG,
  // namun jika nominal total jasa parkir yang belum dibayarkan belum melebihi total (90 hari x jasa parkir harian) maka status PARKIR."
  const batas_nominal_lelang = 90 * (Number(unit.jasa_parkir) || 0);
  const is_lelang_otomatis = unit.status !== 'Lunas' && jasa_parkir_belum_bayar > batas_nominal_lelang;

  let display_status: UnitStatus = 'Parkir';
  if (unit.status === 'Lunas') {
    display_status = 'Lunas';
  } else if (is_lelang_otomatis) {
    display_status = 'Lelang';
  } else {
    display_status = 'Parkir';
  }

  const is_expired_lunas = isLunasExpired(unit);

  const { dueDateStr: tanggal_jatuh_tempo, sisaHari: sisa_hari_jatuh_tempo } = calculateCycleDueDate(unit.tanggal_masuk);
  const kategori_tempo = getTempoCategory(sisa_hari_jatuh_tempo, display_status);

  return {
    ...unit,
    jumlah_hari,
    total_jasa_parkir,
    total_pemasukan,
    jasa_parkir_belum_bayar,
    batas_nominal_lelang,
    total_penebusan,
    hari_tanpa_pemasukan,
    is_lelang_otomatis,
    is_expired_lunas,
    display_status,
    tanggal_jatuh_tempo,
    sisa_hari_jatuh_tempo,
    kategori_tempo,
  };
}

/**
 * Standardize WhatsApp phone number
 */
export function cleanWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Generate WhatsApp reminder for H-2, H-1, H-0 (TANPA MEMBOCORKAN PEMILIK MODAL)
 */
export function generateTempoReminderWA(unit: ComputedMotorUnit): string {
  const tglTempo = formatDateIndo(unit.tanggal_jatuh_tempo);
  let statusText = '';
  if (unit.sisa_hari_jatuh_tempo === 0) {
    statusText = 'HARI INI (H-0)';
  } else if (unit.sisa_hari_jatuh_tempo === 1) {
    statusText = 'BESOK (H-1)';
  } else if (unit.sisa_hari_jatuh_tempo === 2) {
    statusText = '2 HARI LAGI (H-2)';
  } else {
    statusText = `LEWAT JATUH TEMPO (${Math.abs(unit.sisa_hari_jatuh_tempo)} HARI)`;
  }

  return `*PENGINGAT JATUH TEMPO - MOTORKU*
No. Struk: ${unit.no_struk || '-'}

Kepada Yth. *${unit.nama_pemilik}*,
Kami menginformasikan bahwa jatuh tempo pembayaran jasa parkir untuk kendaraan:

🏍️ *Unit:* ${unit.jenis_motor} (${unit.tahun})
🔢 *Nomor Polisi:* ${unit.nopol}
📅 *Jatuh Tempo:* ${tglTempo} (${statusText})

*Rincian Tagihan:*
- Tarif Jasa Parkir Harian: ${formatRupiah(unit.jasa_parkir)} / hari
- Total Jasa Parkir (${unit.jumlah_hari} hari): ${formatRupiah(unit.total_jasa_parkir)}
- Sudah Dibayarkan: ${formatRupiah(unit.total_pemasukan)}
- Sisa Jasa Parkir: ${formatRupiah(unit.jasa_parkir_belum_bayar)}
- Total Penebusan Penuh: ${formatRupiah(unit.total_penebusan)}

Mohon konfirmasi atau melakukan perpanjangan/pembayaran jasa parkir tepat waktu agar status unit tetap aman.

Terima kasih.
_MOTORKU - Manajemen Penitipan & Gadai Motor_`;
}
