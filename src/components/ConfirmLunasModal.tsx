import React from 'react';
import { ComputedMotorUnit } from '../types/motor';
import { formatRupiah } from '../utils/calculations';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ConfirmLunasModalProps {
  unit: ComputedMotorUnit | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmLunas: (unitId: string) => void;
}

export const ConfirmLunasModal: React.FC<ConfirmLunasModalProps> = ({
  unit,
  isOpen,
  onClose,
  onConfirmLunas,
}) => {
  if (!isOpen || !unit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="luxury-card bg-[#0d1424] border border-amber-500/30 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-emerald-950/30">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <h2 className="text-base font-bold text-white">Konfirmasi Pelunasan Unit</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Apakah Anda yakin ingin menandai unit <strong className="text-white">{unit.nopol}</strong> ({unit.jenis_motor} &mdash; {unit.nama_pemilik}) sebagai <strong className="text-emerald-400">LUNAS</strong>?
          </p>

          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Nominal Pokok:</span>
              <span className="font-semibold text-slate-200 font-mono-numbers">
                {formatRupiah(unit.nominal_pokok)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sisa Jasa Parkir:</span>
              <span className="font-semibold text-slate-200 font-mono-numbers">
                {formatRupiah(unit.jasa_parkir_belum_bayar)}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
              <span className="text-slate-300">Total Pelunasan:</span>
              <span className="text-emerald-400 font-mono-numbers text-sm">
                {formatRupiah(unit.total_penebusan)}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <strong>Aturan 1 Minggu:</strong> Setelah berstatus Lunas, unit ini akan tetap tampil di tabel aktif selama <strong>7 hari</strong>, dan setelah 1 minggu akan otomatis diarsipkan dari tabel utama.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 bg-slate-900/80 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmLunas(unit.id);
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 rounded-lg shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            Tandai Lunas Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};
