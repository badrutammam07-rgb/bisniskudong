import React from 'react';
import { ComputedMotorUnit } from '../types/motor';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  unit: ComputedMotorUnit | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (unitId: string) => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  unit,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !unit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="luxury-card bg-[#0d1424] border border-rose-500/40 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-rose-950/40">
          <div className="flex items-center gap-2.5 text-rose-400">
            <Trash2 className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-white">Hapus Permanen dari Database</h2>
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
            Apakah Anda yakin ingin menghapus data unit{' '}
            <strong className="text-white font-mono-numbers">{unit.nopol}</strong> (
            {unit.jenis_motor} &mdash; <span className="font-semibold">{unit.nama_pemilik}</span>)?
          </p>

          <div className="p-3.5 bg-rose-950/30 border border-rose-500/30 rounded-xl space-y-2 text-xs text-rose-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <strong>Penghapusan Unit:</strong> Unit motor akan dihapus dari database. Data penggadai ({unit.nama_pemilik}) tetap tersimpan aman di direktori penggadai untuk kemudahan gadai kembali.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 bg-slate-900/90 border-t border-slate-800">
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
              onConfirmDelete(unit.id);
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 rounded-lg shadow-md shadow-rose-900/40 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Ya, Hapus Permanen
          </button>
        </div>
      </div>
    </div>
  );
};
