import React, { useState, useRef, useEffect } from 'react';
import { ComputedMotorUnit } from '../types/motor';
import { formatDateIndo, formatRupiah, cleanWhatsAppNumber } from '../utils/calculations';
import { toBlob, toPng } from 'html-to-image';
import {
  X,
  Send,
  Download,
  Copy,
  Check,
  Printer,
  Image as ImageIcon,
  Loader2,
  Share2,
  Phone,
  ExternalLink,
  Info,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface ReceiptModalProps {
  unit: ComputedMotorUnit | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePhone?: (unitId: string, newPhone: string) => Promise<void> | void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  unit,
  isOpen,
  onClose,
  onUpdatePhone,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharingSystem, setIsSharingSystem] = useState(false);
  const [copiedPhoto, setCopiedPhoto] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [targetWaNumber, setTargetWaNumber] = useState('');

  // Sinkronkan nomor WhatsApp saat unit berubah atau modal dibuka
  useEffect(() => {
    if (unit) {
      setTargetWaNumber(unit.no_whatsapp || '');
      setFeedbackMsg(null);
      setCopiedPhoto(false);
      setCopiedText(false);
    }
  }, [unit, isOpen]);

  if (!isOpen || !unit) return null;

  const tglMasuk = formatDateIndo(unit.tanggal_masuk);
  const tglCetak = formatDateIndo(new Date().toISOString().slice(0, 10));
  const cleanPhone = cleanWhatsAppNumber(targetWaNumber);

  // Teks ringkasan untuk caption pesan WhatsApp
  const generateReceiptText = () => {
    return `*STRUK RESMI GADAI MOTORKU*
No. Struk: ${unit.no_struk || '-'}
Tanggal: ${tglCetak}

*Data Penggadai:*
• Nama: ${unit.nama_pemilik}
${unit.nik ? `• NIK: ${unit.nik}\n` : ''}${unit.alamat ? `• Alamat: ${unit.alamat}\n` : ''}• Unit: ${unit.jenis_motor} (${unit.tahun})
• No. Polisi: ${unit.nopol}
• Tgl Masuk: ${tglMasuk}
• Durasi: ${unit.jumlah_hari} Hari
• Tarif: ${formatRupiah(unit.jasa_parkir)}/hari

*Rincian Finansial:*
• Pinjaman Pokok: ${formatRupiah(unit.nominal_pokok)}
• Total Jasa (${unit.jumlah_hari} hr): ${formatRupiah(unit.total_jasa_parkir)}
• Terbayar: -${formatRupiah(unit.total_pemasukan)}
• Sisa Jasa: ${formatRupiah(unit.jasa_parkir_belum_bayar)}

*TOTAL BIAYA PENEBUSAN:*
👉 *${formatRupiah(unit.total_penebusan)}*
(Status: ${unit.display_status.toUpperCase()})

*Rekening Pembayaran:*
BCA 2410037249
a/n Badru Tammam`;
  };

  // Helper untuk merender foto struk ukuran penuh 1 halaman tanpa terpotong
  const captureFullReceiptBlob = async (): Promise<Blob> => {
    if (!receiptRef.current) {
      throw new Error('Elemen struk tidak ditemukan');
    }
    const el = receiptRef.current;

    // Hitung ukuran aktual penuh elemen agar tidak terpotong
    const captureWidth = el.scrollWidth || el.offsetWidth || 440;
    const captureHeight = el.scrollHeight || el.offsetHeight;

    const blob = await toBlob(el, {
      pixelRatio: 2.5, // Kualitas tinggi & tajam, aman dari memory limit browser
      backgroundColor: '#ffffff',
      cacheBust: true,
      width: captureWidth,
      height: captureHeight,
      style: {
        transform: 'none',
        margin: '0',
        maxHeight: 'none',
        overflow: 'visible',
      },
    });

    if (!blob) {
      throw new Error('Gagal menghasilkan file gambar struk');
    }
    return blob;
  };

  // Fungsi Kirim Struk FOTO ke WhatsApp agar foto tampil langsung
  const handleSendPhotoWhatsApp = async () => {
    if (!receiptRef.current) return;

    const targetPhoneClean = cleanWhatsAppNumber(targetWaNumber);
    if (!targetPhoneClean) {
      alert('Nomor WhatsApp penggadai belum diisi. Silakan masukkan nomor WhatsApp pada kolom di bawah.');
      return;
    }

    setIsGenerating(true);
    setFeedbackMsg(null);

    // Simpan nomor jika ada perubahan
    if (onUpdatePhone && targetWaNumber.trim() !== (unit.no_whatsapp || '').trim()) {
      onUpdatePhone(unit.id, targetWaNumber.trim());
    }

    try {
      // 1. Render foto struk penuh 1 halaman tanpa terpotong
      const blob = await captureFullReceiptBlob();
      const fileName = `struk-${(unit.no_struk || unit.nopol).replace(/\s+/g, '_')}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });
      const summaryText = generateReceiptText();

      // 2. Salin otomatis ke clipboard (berfungsi baik di Desktop & Mobile)
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopiedPhoto(true);
        } catch (clipErr) {
          console.warn('Clipboard write notice:', clipErr);
        }
      }

      // 3. Jika browser mendukung Web Share API dengan file (fitur native di smartphone Android & iOS)
      // Ini adalah SATU-SATUNYA cara browser mengirim file foto langsung ke WhatsApp
      // sehingga foto langsung TAMPIL di chat WhatsApp penggadai!
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Struk Motorku - ${unit.nopol}`,
            text: summaryText,
          });

          setFeedbackMsg({
            type: 'success',
            text: `Foto struk berhasil dikirim ke WhatsApp penggadai (+${targetPhoneClean})!`,
          });
          return;
        } catch (shareErr: any) {
          // Jika user membatalkan share sheet, jangan anggap error fatal
          if (shareErr.name === 'AbortError') {
            console.log('Share was cancelled by user');
            setIsGenerating(false);
            return;
          }
          console.warn('Share file fallback:', shareErr);
        }
      }

      // 4. Fallback untuk Desktop PC atau browser yang tidak mendukung native share file:
      // Otomatis unduh foto agar tersimpan di komputer/HP
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 3000);

      // Buka chat WhatsApp ke nomor penggadai dengan teks ringkasan
      const waUrl = `https://api.whatsapp.com/send?phone=${targetPhoneClean}&text=${encodeURIComponent(
        summaryText
      )}`;

      setFeedbackMsg({
        type: 'info',
        text: `Membuka WhatsApp ke +${targetPhoneClean}. Foto struk telah disalin ke clipboard! Tekan Tempel (Ctrl+V) di kolom chat untuk menampilkan foto.`,
      });

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = waUrl;
      } else {
        const opened = window.open(waUrl, '_blank');
        if (!opened) {
          window.location.href = waUrl;
        }
      }
    } catch (err: any) {
      console.error('Error generating receipt photo:', err);
      alert('Gagal membuat foto struk. Silakan gunakan tombol "Unduh Foto (PNG)".');
    } finally {
      setIsGenerating(false);
    }
  };

  // Fungsi buka chat WhatsApp langsung ke nomor tujuan
  const handleOpenDirectWhatsAppChat = () => {
    const targetPhoneClean = cleanWhatsAppNumber(targetWaNumber);
    if (!targetPhoneClean) {
      alert('Silakan masukkan nomor WhatsApp penggadai terlebih dahulu.');
      return;
    }
    const summaryText = generateReceiptText();
    const waUrl = `https://api.whatsapp.com/send?phone=${targetPhoneClean}&text=${encodeURIComponent(
      summaryText
    )}`;
    window.open(waUrl, '_blank');
  };

  // Fungsi unduh foto struk resolusi tinggi
  const handleDownloadPhoto = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);
    try {
      const blob = await captureFullReceiptBlob();
      const fileName = `struk-${(unit.no_struk || unit.nopol).replace(/\s+/g, '_')}.png`;
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 3000);

      setFeedbackMsg({
        type: 'success',
        text: 'Foto struk ukuran penuh 1 halaman berhasil diunduh!',
      });
    } catch (err) {
      console.error('Download error:', err);
      alert('Gagal mengunduh foto struk.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Fungsi salin gambar foto ke clipboard
  const handleCopyImageToClipboard = async () => {
    if (!receiptRef.current) return;
    try {
      const blob = await captureFullReceiptBlob();
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopiedPhoto(true);
        setFeedbackMsg({
          type: 'success',
          text: 'Gambar foto struk telah disalin ke clipboard! Siap di-paste (Ctrl+V) ke WhatsApp.',
        });
        setTimeout(() => setCopiedPhoto(false), 3000);
      } else {
        alert('Browser Anda tidak mendukung salin gambar langsung. Silakan gunakan tombol "Unduh Foto (PNG)".');
      }
    } catch (err) {
      console.error('Copy image error:', err);
      alert('Gagal menyalin gambar foto ke clipboard.');
    }
  };

  // Fungsi salin teks struk
  const handleCopyText = async () => {
    try {
      const text = generateReceiptText();
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Cetak fisik standar
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="luxury-card bg-[#0d1424] border border-amber-500/30 rounded-2xl shadow-2xl w-full max-w-xl my-2 sm:my-6 overflow-hidden text-slate-100 flex flex-col max-h-[96vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-900/80 shrink-0">
          <div className="min-w-0 pr-2">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="gold-gradient-text truncate">Kirim Struk Foto ke WhatsApp</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
              Ukuran penuh 1 halaman &bull; Penggadai: <span className="text-slate-200 font-semibold">{unit.nama_pemilik}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifikasi Banner Feedback */}
        {feedbackMsg && (
          <div
            className={`px-4 sm:px-6 py-2.5 border-b text-xs flex items-center gap-2 shrink-0 animate-fadeIn ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium leading-relaxed">{feedbackMsg.text}</span>
          </div>
        )}

        {/* Receipt Container - Didesain khusus 1 halaman penuh tanpa terpotong */}
        <div className="p-3 sm:p-6 bg-[#060a12] flex justify-center items-start overflow-y-auto overflow-x-auto min-h-[360px]">
          {/* Elemen Struk Fisik / Foto */}
          <div
            ref={receiptRef}
            id="printable-receipt"
            className="w-full max-w-[430px] bg-white text-slate-950 p-6 sm:p-7 shadow-2xl rounded-sm border border-slate-300 font-sans select-none"
            style={{
              boxSizing: 'border-box',
              minHeight: 'auto',
            }}
          >
            {/* Header Struk */}
            <div className="text-center pb-4 border-b-2 border-dashed border-slate-400">
              <div className="text-2xl font-black text-slate-950 tracking-wider">
                MOTORKU
              </div>
              <div className="text-[11px] font-extrabold text-slate-700 uppercase tracking-widest mt-0.5">
                LAYANAN GADAI &amp; PENITIPAN MOTOR
              </div>
              <div className="mt-2 inline-block px-3 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                BUKTI PENERIMAAN RESMI
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-700 mt-3 pt-2 border-t border-slate-200 font-medium">
                <div>
                  No. Struk: <span className="font-bold font-mono text-slate-950">{unit.no_struk || '-'}</span>
                </div>
                <div>
                  Tgl Cetak: <span className="font-semibold">{tglCetak}</span>
                </div>
              </div>
            </div>

            {/* Informasi Penggadai & Kendaraan */}
            <div className="py-3.5 border-b border-dashed border-slate-400 space-y-2 text-[12px]">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-slate-600 font-medium shrink-0">Nama Penggadai:</span>
                <span className="font-bold text-slate-950 text-right uppercase text-[13px]">{unit.nama_pemilik}</span>
              </div>
              {unit.nik && (
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-slate-600 font-medium shrink-0">NIK:</span>
                  <span className="font-bold font-mono text-slate-950 text-right">{unit.nik}</span>
                </div>
              )}
              {targetWaNumber && (
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-slate-600 font-medium shrink-0">No. WhatsApp:</span>
                  <span className="font-semibold font-mono text-slate-900 text-right">+{cleanPhone || targetWaNumber}</span>
                </div>
              )}
              {unit.alamat && (
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-600 font-medium shrink-0">Alamat:</span>
                  <span className="font-medium text-slate-900 text-right leading-snug">{unit.alamat}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline gap-2 pt-1 border-t border-slate-100">
                <span className="text-slate-600 font-medium shrink-0">Unit Kendaraan:</span>
                <span className="font-bold text-slate-950 text-right">{unit.jenis_motor} ({unit.tahun})</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-600 font-medium shrink-0">Nomor Polisi:</span>
                <span className="px-2 py-0.5 bg-slate-900 text-white font-mono font-bold text-xs rounded tracking-wider shadow-xs">
                  {unit.nopol}
                </span>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-slate-600 font-medium shrink-0">Tanggal Masuk:</span>
                <span className="font-semibold text-slate-800 text-right">{tglMasuk}</span>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-slate-600 font-medium shrink-0">Jumlah Durasi:</span>
                <span className="font-bold text-slate-950 text-right">{unit.jumlah_hari} Hari</span>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-slate-600 font-medium shrink-0">Tarif Parkir Harian:</span>
                <span className="font-bold text-slate-950 text-right">{formatRupiah(unit.jasa_parkir)} / hari</span>
              </div>
            </div>

            {/* Rincian Finansial Lengkap */}
            <div className="py-3.5 border-b border-dashed border-slate-400 space-y-2 text-[12px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-medium">Pinjaman Pokok:</span>
                <span className="font-bold text-slate-950 text-[13px]">{formatRupiah(unit.nominal_pokok)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">
                  Total Jasa ({unit.jumlah_hari} hr &times; {formatRupiah(unit.jasa_parkir)}):
                </span>
                <span className="font-bold text-slate-950">{formatRupiah(unit.total_jasa_parkir)}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-800 bg-emerald-50/80 px-2 py-1 rounded">
                <span className="font-medium">Total Pemasukan / Terbayar:</span>
                <span className="font-bold">-{formatRupiah(unit.total_pemasukan)}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
                <span className="text-slate-800 font-semibold">Jasa Parkir Belum Bayar:</span>
                <span className="font-bold text-amber-950">{formatRupiah(unit.jasa_parkir_belum_bayar)}</span>
              </div>
            </div>

            {/* Total Penebusan Highlight Box */}
            <div className="my-3 py-3.5 bg-slate-100 rounded-lg border-2 border-slate-300 text-center px-4">
              <div className="text-[11px] text-slate-700 uppercase tracking-wider font-extrabold">
                TOTAL BIAYA PENEBUSAN
              </div>
              <div className="text-2xl font-black text-slate-950 tracking-tight mt-0.5 font-mono">
                {formatRupiah(unit.total_penebusan)}
              </div>
              <div className="text-[10px] text-slate-600 mt-1 font-medium">
                (Nominal Pokok + Sisa Jasa Parkir)
              </div>
              <div className="mt-2 inline-block px-3 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border border-slate-400 bg-white text-slate-900">
                STATUS: {unit.display_status.toUpperCase()}
              </div>
            </div>

            {/* Rekening Pembayaran Resmi */}
            <div className="pt-2 text-center">
              <div className="text-[11px] text-slate-600 font-medium">
                segera lakukan pembayaran ke
              </div>
              <div className="text-base font-black text-slate-950 font-mono tracking-wider mt-0.5">
                BCA 2410037249
              </div>
              <div className="text-[12px] font-bold text-slate-800">
                a/n Badru Tammam
              </div>
            </div>

            {/* Subfooter identifikasi sistem */}
            <div className="mt-3 pt-2.5 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-500 font-medium">
              Sistem Manajemen Gadai Motorku
            </div>
          </div>
        </div>

        {/* Panel Kontrol & Nomor WhatsApp Tujuan */}
        <div className="p-4 sm:p-5 bg-slate-900/95 border-t border-slate-800 space-y-3 shrink-0">
          {/* Kolom Nomor WhatsApp Penggadai */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nomor WhatsApp Penggadai:</span>
              </span>
              {cleanPhone ? (
                <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  +{cleanPhone}
                </span>
              ) : (
                <span className="text-[11px] font-medium text-amber-400">
                  Belum diisi
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="tel"
                  value={targetWaNumber}
                  onChange={(e) => setTargetWaNumber(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-400 outline-hidden font-mono-numbers"
                />
                <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
              {onUpdatePhone && targetWaNumber.trim() !== (unit.no_whatsapp || '').trim() && cleanPhone && (
                <button
                  type="button"
                  onClick={() => onUpdatePhone(unit.id, targetWaNumber.trim())}
                  className="px-3 py-2 text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Simpan nomor WhatsApp baru ini ke data penggadai"
                >
                  Simpan No WA
                </button>
              )}
            </div>

            {!cleanPhone ? (
              <p className="text-[11px] text-amber-300/90 leading-tight">
                ⚠️ Nomor WhatsApp belum terisi. Masukkan nomor di atas agar struk foto langsung terkirim ke kontak penggadai.
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 leading-tight">
                Foto struk akan dibuat 1 halaman penuh &bull; langsung menampilkan foto di WhatsApp saat dikirim.
              </p>
            )}
          </div>

          {/* Tombol Utama */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Tombol Utama: Kirim Foto ke WhatsApp (Tampil Foto) */}
            <button
              onClick={handleSendPhotoWhatsApp}
              disabled={isGenerating || !cleanPhone}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                cleanPhone
                  ? 'text-slate-950 bg-gradient-to-r from-emerald-400 via-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-emerald-500/25'
                  : 'text-slate-400 bg-slate-800 border border-slate-700'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Memproses Foto Penuh...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span className="truncate">
                    {cleanPhone ? `Kirim Foto ke WA (+${cleanPhone})` : 'Kirim Foto ke WhatsApp'}
                  </span>
                </>
              )}
            </button>

            {/* Tombol Unduh Foto PNG Resolusi Penuh */}
            <button
              onClick={handleDownloadPhoto}
              disabled={isDownloading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Mengunduh Foto...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Unduh Foto Struk (PNG)</span>
                </>
              )}
            </button>
          </div>

          {/* Baris Tombol Aksi Tambahan */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Tombol Salin Gambar (untuk paste di WhatsApp Web) */}
              <button
                onClick={handleCopyImageToClipboard}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Salin foto ke clipboard untuk langsung ditempel (Ctrl+V) di WhatsApp"
              >
                {copiedPhoto ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 font-semibold">Foto Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Salin Foto</span>
                  </>
                )}
              </button>

              {/* Buka Chat Langsung jika perlu kirim pesan biasa */}
              {cleanPhone && (
                <button
                  onClick={handleOpenDirectWhatsAppChat}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
                  title="Buka ruang obrolan WhatsApp penggadai secara langsung"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Chat WA</span>
                </button>
              )}

              {/* Salin Teks */}
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title="Salin rincian struk dalam bentuk teks"
              >
                {copiedText ? (
                  <span className="text-emerald-300">Teks Tersalin!</span>
                ) : (
                  <span>Salin Teks</span>
                )}
              </button>

              {/* Cetak Fisik */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Cetak Fisik</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs px-2 py-1"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
