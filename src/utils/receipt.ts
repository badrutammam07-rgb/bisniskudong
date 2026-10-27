import { ComputedMotorUnit } from '../types/motor';
import { cleanWhatsAppNumber, formatDateIndo, formatRupiah } from './calculations';

/**
 * Generate official receipt text for WhatsApp.
 * CATATAN PENTING SESUAI ATURAN:
 * Menginfokan:
 * - Nama pemilik
 * - Jenis motor & tahun
 * - Nopol
 * - Tanggal masuk & jumlah hari
 * - JASA PARKIR HARIAN YANG TELAH DITENTUKAN (e.g. Rp 5.000 / hari)
 * - Jumlah pokok
 * - Total jasa parkir (jumlah hari x jasa parkir)
 * - Pemasukan yang sudah dibayarkan
 * - Jasa parkir yang belum dibayarkan (total jasa parkir - pemasukan)
 * - Total penembusan jika ingin ditebus (nominal pokok + jasa parkir yang belum dibayarkan)
 * TANPA mengirimkan pemilik modal.
 */
export function generateWhatsAppReceiptText(unit: ComputedMotorUnit): string {
  const tglMasuk = formatDateIndo(unit.tanggal_masuk);
  const tglCetak = formatDateIndo(new Date().toISOString().slice(0, 10));

  const text = `*MOTORKU - STRUK PENITIPAN & GADAI MOTOR*
No. Struk: ${unit.no_struk || '-'}
Tanggal: ${tglCetak}

Kepada Yth.
*Nama Pemilik:* ${unit.nama_pemilik}

*DETAIL KENDARAAN:*
- Jenis Motor: ${unit.jenis_motor} (${unit.tahun})
- Nopol: ${unit.nopol}
- Tanggal Masuk: ${tglMasuk}
- Jumlah Hari: ${unit.jumlah_hari} Hari
- Tarif Jasa Parkir Harian: ${formatRupiah(unit.jasa_parkir)} / hari

*RINCIAN BIAYA & ADMINISTRASI:*
1. Jumlah Pokok: ${formatRupiah(unit.nominal_pokok)}
2. Jasa Parkir Harian: ${formatRupiah(unit.jasa_parkir)} / hari
3. Total Jasa Parkir (${unit.jumlah_hari} hari x ${formatRupiah(unit.jasa_parkir)}): ${formatRupiah(unit.total_jasa_parkir)}
4. Total Pemasukan / Terbayar: ${formatRupiah(unit.total_pemasukan)}
5. Jasa Parkir Belum Dibayarkan: ${formatRupiah(unit.jasa_parkir_belum_bayar)}

================================
*TOTAL PENEBUSAN:* ${formatRupiah(unit.total_penebusan)}
*(Nominal Pokok + Jasa Parkir Belum Bayar)*
================================

*Status Unit:* ${unit.display_status.toUpperCase()}

_Harap simpan struk ini sebagai bukti pembayaran dan transaksi yang sah. Untuk info penebusan silakan hubungi kami._`;

  return text;
}

/**
 * Buat URL WhatsApp langsung
 */
export function generateWhatsAppLink(unit: ComputedMotorUnit): string {
  const phone = cleanWhatsAppNumber(unit.no_whatsapp);
  const message = generateWhatsAppReceiptText(unit);
  const encoded = encodeURIComponent(message);
  
  if (phone) {
    return `https://wa.me/${phone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}
