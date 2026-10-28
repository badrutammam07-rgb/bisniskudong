import React, { useState, useRef } from 'react';
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
  ShieldCheck,
  Image as ImageIcon,
  Loader2,
  Share2,
} from 'lucide-react';

interface ReceiptModalProps {
  unit: ComputedMotorUnit | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  unit,
  isOpen,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedPhoto, setCopiedPhoto] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen || !unit) return null;

  const tglMasuk = formatDateIndo(unit.tanggal_masuk);
  const tglCetak = formatDateIndo(new Date().toISOString().slice(0, 10));
  const cleanPhone = cleanWhatsAppNumber(unit.no_whatsapp);

  // Fungsi kirim struk sebagai FOTO ke WhatsApp (tanpa teks)
  const handleSendPhotoWhatsApp = async () => {
    if (!receiptRef.current) return;
    setIsGenerating(true);
    setFeedbackMsg(null);

    try {
      // Generate crisp high-resolution photo from the receipt
      const blob = await toBlob(receiptRef.current, {
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      if (!blob) {
        throw new Error('Gagal merender foto struk');
      }

      const fileName = `struk-${(unit.no_struk || unit.nopol).replace(/\s+/g, '_')}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // Salin otomatis ke clipboard jika didukung browser (memudahkan WhatsApp Web di PC)
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
        } catch {
          // Abaikan jika browser tidak mengizinkan clipboard image langsung
        }
      }

      // 1. Jika di Smartphone (Android / iOS): gunakan Web Share API untuk langsung membuka WhatsApp dengan file foto terlampir
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Struk Motorku - ${unit.nopol}`,
        });
        setFeedbackMsg('Foto struk siap dikirimkan ke chat WhatsApp!');
      } else {
        // 2. Jika di Komputer / Browser Desktop:
        // Unduh foto otomatis dan buka chat WhatsApp murni tanpa teks, siap di-Paste (Ctrl+V)
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        setFeedbackMsg('Foto struk telah disalin ke clipboard & diunduh! Silakan Tempel (Ctrl+V) foto di WhatsApp.');

        const waTarget = cleanPhone
          ? `https://wa.me/${cleanPhone}`
          : 'https://web.whatsapp.com/';
        window.open(waTarget, '_blank');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing receipt photo:', err);
        alert('Gagal memproses foto struk. Silakan gunakan tombol "Unduh Foto (PNG)" di bawah.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Fungsi mengunduh foto struk langsung sebagai file PNG
  const handleDownloadPhoto = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(receiptRef.current, {
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      const fileName = `struk-${(unit.no_struk || unit.nopol).replace(/\s+/g, '_')}.png`;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
      const blob = await toBlob(receiptRef.current, {
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopiedPhoto(true);
        setTimeout(() => setCopiedPhoto(false), 2500);
      } else {
        alert('Browser Anda tidak mendukung salin gambar langsung. Silakan gunakan tombol "Unduh Foto (PNG)".');
      }
    } catch (err) {
      console.error('Copy image error:', err);
      alert('Gagal menyalin gambar foto ke clipboard.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="luxury-card bg-[#0d1424] border border-amber-500/30 rounded-2xl shadow-2xl w-full max-w-lg my-4 sm:my-8 overflow-hidden text-slate-100 flex flex-col max-h-[94vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900/70 shrink-0">
          <div className="min-w-0 pr-2">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="gold-gradient-text truncate">Foto Struk WhatsApp</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
              Kirim struk berupa FOTO ke {unit.nama_pemilik} ({unit.no_whatsapp || 'Tanpa no. WA'})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifikasi / Feedback Banner jika foto siap */}
        {feedbackMsg && (
          <div className="px-4 sm:px-6 py-2.5 bg-amber-500/20 border-b border-amber-500/30 text-amber-200 text-xs flex items-center gap-2 animate-fadeIn shrink-0">
            <Check className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Thermal Receipt Visual Element to be Captured as Photo */}
        <div className="p-4 sm:p-6 bg-[#080d17] flex justify-center overflow-y-auto">
          <div
            ref={receiptRef}
            id="printable-receipt"
            className="w-full max-w-sm bg-white p-5 sm:p-6 shadow-2xl border border-slate-300 font-sans text-xs text-slate-900 rounded-sm select-none"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Header Struk */}
            <div className="text-center pb-3 border-b-2 border-dashed border-slate-400">
              <div className="text-lg font-black text-slate-950 tracking-wider">
                MOTORKU
              </div>
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">
                Layanan Penitipan &amp; Gadai Motor
              </div>
              <div className="text-[11px] font-mono text-slate-800 mt-2 font-semibold">
                No. Struk: <span className="font-bold text-slate-950">{unit.no_struk || '-'}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Tanggal: {tglCetak}
              </div>
            </div>

            {/* Informasi Penggadai & Kendaraan */}
            <div className="py-3 border-b border-dashed border-slate-400 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Nama Penggadai:</span>
                <span className="font-bold text-slate-950 text-right uppercase">{unit.nama_pemilik}</span>
              </div>
              {unit.nik && (
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">NIK:</span>
                  <span className="font-bold font-mono text-slate-950 text-right">{unit.nik}</span>
                </div>
              )}
              {unit.alamat && (
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-600 font-medium shrink-0">Alamat:</span>
                  <span className="font-medium text-slate-900 text-right">{unit.alamat}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Jenis Motor:</span>
                <span className="font-semibold text-slate-950 text-right">{unit.jenis_motor} ({unit.tahun})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Nomor Polisi:</span>
                <span className="font-bold text-slate-950 font-mono tracking-wider text-right">{unit.nopol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Tgl Masuk:</span>
                <span className="text-slate-800 text-right">{tglMasuk}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Jumlah Durasi:</span>
                <span className="font-bold text-slate-950 text-right">{unit.jumlah_hari} Hari</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Tarif Parkir Harian:</span>
                <span className="font-bold text-slate-950 text-right">{formatRupiah(unit.jasa_parkir)} / hr</span>
              </div>
            </div>

            {/* Rincian Finansial */}
            <div className="py-3 border-b border-dashed border-slate-400 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-700">Jumlah Pokok:</span>
                <span className="font-bold text-slate-950">{formatRupiah(unit.nominal_pokok)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700">
                  Total Jasa ({unit.jumlah_hari} hr &times; {formatRupiah(unit.jasa_parkir)}):
                </span>
                <span className="font-bold text-slate-950">{formatRupiah(unit.total_jasa_parkir)}</span>
              </div>
              <div className="flex justify-between text-emerald-800">
                <span>Pemasukan / Terbayar:</span>
                <span className="font-bold">-{formatRupiah(unit.total_pemasukan)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-800 font-semibold">Jasa Parkir Belum Bayar:</span>
                <span className="font-bold text-amber-900">{formatRupiah(unit.jasa_parkir_belum_bayar)}</span>
              </div>
            </div>

            {/* Total Penebusan Highlight */}
            <div className="py-3 bg-slate-100 -mx-5 sm:-mx-6 px-5 sm:px-6 border-b-2 border-dashed border-slate-400 text-center">
              <div className="text-[10px] text-slate-600 uppercase tracking-wider font-bold">
                Total Biaya Penebusan
              </div>
              <div className="text-xl font-black text-slate-950 mt-0.5">
                {formatRupiah(unit.total_penebusan)}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">
                (Nominal Pokok + Sisa Jasa Parkir)
              </div>
            </div>

            {/* Footer Struk */}
            <div className="pt-3 text-center space-y-2">
              <div>
                <span className="inline-block px-3 py-0.5 bg-slate-100 text-slate-800 font-bold rounded text-[10px] uppercase tracking-wider border border-slate-300">
                  Status: {unit.display_status.toUpperCase()}
                </span>
              </div>

              {/* Petunjuk Pembayaran */}
              <div className="pt-2 border-t border-dashed border-slate-300 text-center">
                <div className="text-[11px] text-slate-600 font-medium">
                  segera lakukan pembayaran ke
                </div>
                <div className="text-sm font-extrabold text-slate-950 font-mono tracking-wider mt-0.5">
                  BCA 2410037249
                </div>
                <div className="text-[11px] font-bold text-slate-800">
                  a/n Badru Tammam
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-5 bg-slate-900/95 border-t border-slate-800 space-y-3 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Tombol Kirim Foto WhatsApp Utama */}
            <button
              onClick={handleSendPhotoWhatsApp}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Foto Struk...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span>Kirim Foto ke WhatsApp</span>
                </>
              )}
            </button>

            {/* Tombol Unduh Foto PNG */}
            <button
              onClick={handleDownloadPhoto}
              disabled={isDownloading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Mengunduh...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Unduh Foto Struk (PNG)</span>
                </>
              )}
            </button>
          </div>

          {/* Tombol Salin Gambar Foto & Print */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyImageToClipboard}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition-colors cursor-pointer"
                title="Salin gambar foto ke clipboard untuk ditempel di WhatsApp Web"
              >
                {copiedPhoto ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Gambar Foto Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Salin Gambar Foto</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Cetak Fisik</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
