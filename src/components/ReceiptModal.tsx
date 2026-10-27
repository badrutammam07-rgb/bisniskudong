import React, { useState } from 'react';
import { ComputedMotorUnit } from '../types/motor';
import { formatDateIndo, formatRupiah } from '../utils/calculations';
import { generateWhatsAppLink, generateWhatsAppReceiptText } from '../utils/receipt';
import { X, Send, Copy, Check, Printer, ShieldCheck } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

  if (!isOpen || !unit) return null;

  const tglMasuk = formatDateIndo(unit.tanggal_masuk);
  const tglCetak = formatDateIndo(new Date().toISOString().slice(0, 10));
  const waLink = generateWhatsAppLink(unit);
  const receiptText = generateWhatsAppReceiptText(unit);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receiptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="luxury-card bg-[#0d1424] border border-amber-500/30 rounded-2xl shadow-2xl w-full max-w-lg my-8 overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="gold-gradient-text">Struk Transaksi &amp; Kirim WhatsApp</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Siap dikirim ke nomor {unit.no_whatsapp || '(Belum ada nomor WA)'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security badge: Pemilik modal tidak dikirim */}
        <div className="px-6 py-2.5 bg-emerald-950/40 border-b border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Privasi Terjamin:</strong> Informasi pemilik modal (Pribadi/Mamah/Pecel) disembunyikan dari struk pelanggan.
          </span>
        </div>

        {/* Thermal Receipt Visual Preview (Printed cleanly) */}
        <div className="p-6 bg-[#080d17] flex justify-center">
          <div
            id="printable-receipt"
            className="w-full max-w-sm bg-white p-6 shadow-xl border border-slate-300 font-mono-numbers text-xs text-slate-900 rounded-sm"
          >
            {/* Header Struk */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400">
              <div className="text-base font-black text-slate-950 tracking-wider">MOTORKU</div>
              <div className="text-[10px] text-slate-600 uppercase mt-0.5">
                Layanan Penitipan &amp; Gadai Motor
              </div>
              <div className="text-[10px] text-slate-600 mt-1">
                No. Struk: <span className="font-bold text-slate-950">{unit.no_struk || '-'}</span>
              </div>
              <div className="text-[10px] text-slate-500">
                Tanggal: {tglCetak}
              </div>
            </div>

            {/* Informasi Pemilik & Kendaraan */}
            <div className="py-3 border-b border-dashed border-slate-400 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Nama Pemilik:</span>
                <span className="font-bold text-slate-950 text-right">{unit.nama_pemilik}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Jenis Motor:</span>
                <span className="font-semibold text-slate-950 text-right">{unit.jenis_motor} ({unit.tahun})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Nomor Polisi:</span>
                <span className="font-bold text-slate-950 font-mono tracking-wider text-right">{unit.nopol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tgl Masuk:</span>
                <span className="text-slate-800 text-right">{tglMasuk}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Jumlah Durasi:</span>
                <span className="font-bold text-slate-950 text-right">{unit.jumlah_hari} Hari</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tarif Parkir Harian:</span>
                <span className="font-bold text-slate-950 text-right">{formatRupiah(unit.jasa_parkir)} / hari</span>
              </div>
            </div>

            {/* Rincian Finansial */}
            <div className="py-3 border-b border-dashed border-slate-400 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-700">Jumlah Pokok:</span>
                <span className="font-bold text-slate-950">{formatRupiah(unit.nominal_pokok)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700">Tarif Jasa Parkir Harian:</span>
                <span className="font-semibold text-slate-950">{formatRupiah(unit.jasa_parkir)} / hr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700">
                  Total Jasa Parkir ({unit.jumlah_hari} hr &times; {formatRupiah(unit.jasa_parkir)}):
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

            {/* Grand Total Penembusan */}
            <div className="py-3 bg-slate-100 -mx-6 px-6 border-b border-dashed border-slate-400">
              <div className="text-[10px] text-slate-600 uppercase tracking-wider text-center font-bold">
                Total Biaya Penebusan
              </div>
              <div className="text-xl font-black text-center text-slate-950 mt-0.5">
                {formatRupiah(unit.total_penebusan)}
              </div>
              <div className="text-[9px] text-center text-slate-500 mt-0.5">
                (Nominal Pokok + Sisa Jasa Parkir)
              </div>
            </div>

            {/* Footer Struk */}
            <div className="pt-3 text-center space-y-1">
              <div className="text-[10px] font-bold text-slate-800">
                Status: {unit.display_status.toUpperCase()}
              </div>
              <div className="text-[9px] text-slate-500">
                Simpan struk ini sebagai bukti transaksi resmi.
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-slate-900/90 border-t border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Tombol Kirim WhatsApp */}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 rounded-lg shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
              <span>Kirim ke WhatsApp</span>
            </a>

            {/* Tombol Salin Teks */}
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Teks Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Salin Teks Struk</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Cetak Struk Fisik</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
