import React, { useState } from 'react';
import { ComputedMotorUnit, PaymentEntry } from '../types/motor';
import { formatDateIndo, formatRupiah, formatNominalInput, parseNominalInput } from '../utils/calculations';
import { X, Plus, Trash2, Calendar, DollarSign, Receipt, CheckCircle } from 'lucide-react';

interface PaymentModalProps {
  unit: ComputedMotorUnit | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePayments: (unitId: string, payments: PaymentEntry[]) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  unit,
  isOpen,
  onClose,
  onUpdatePayments,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [tanggal, setTanggal] = useState(todayStr);
  const [jumlahText, setJumlahText] = useState('50.000');
  const [catatan, setCatatan] = useState('');

  if (!isOpen || !unit) return null;

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedJumlah = parseNominalInput(jumlahText);
    if (parsedJumlah <= 0) {
      alert('Masukkan nominal pemasukan yang valid.');
      return;
    }

    const newPayment: PaymentEntry = {
      id: 'pay-' + Date.now(),
      tanggal: tanggal || todayStr,
      jumlah: parsedJumlah,
      catatan: catatan.trim() || 'Pembayaran jasa parkir',
    };

    const currentList = unit.pemasukan_detail || [];
    const updated = [...currentList, newPayment];
    onUpdatePayments(unit.id, updated);

    setJumlahText('');
    setCatatan('');
  };

  const handleDeletePayment = (paymentId: string) => {
    if (!confirm('Hapus catatan pembayaran ini?')) return;
    const currentList = unit.pemasukan_detail || [];
    const updated = currentList.filter((p) => p.id !== paymentId);
    onUpdatePayments(unit.id, updated);
  };

  const paymentsSorted = [...(unit.pemasukan_detail || [])].sort(
    (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="luxury-card bg-[#0d1424] border border-amber-500/30 rounded-2xl shadow-2xl w-full max-w-xl my-8 overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              <span className="gold-gradient-text">Detail Pemasukan &amp; Pembayaran</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {unit.nopol} &middot; {unit.jenis_motor} ({unit.nama_pemilik})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial Progress Cards */}
        <div className="p-6 pb-2 grid grid-cols-3 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block tracking-wider">Total Jasa</span>
            <span className="text-sm font-bold text-white font-mono-numbers block mt-1">
              {formatRupiah(unit.total_jasa_parkir)}
            </span>
            <span className="text-[10px] text-slate-500">({unit.jumlah_hari} hari)</span>
          </div>

          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-center">
            <span className="text-[10px] font-semibold text-emerald-300 uppercase block tracking-wider">Total Dibayar</span>
            <span className="text-sm font-bold text-emerald-400 font-mono-numbers block mt-1">
              {formatRupiah(unit.total_pemasukan)}
            </span>
            <span className="text-[10px] text-emerald-500/80">({paymentsSorted.length}x transaksi)</span>
          </div>

          <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 text-center">
            <span className="text-[10px] font-semibold text-amber-300 uppercase block tracking-wider">Sisa Belum Bayar</span>
            <span className="text-sm font-bold text-amber-400 font-mono-numbers block mt-1">
              {formatRupiah(unit.jasa_parkir_belum_bayar)}
            </span>
            <span className="text-[10px] text-amber-500/80">
              {unit.jasa_parkir_belum_bayar === 0 ? 'Lunas Parkir' : 'Tertunggak'}
            </span>
          </div>
        </div>

        {/* Input Form Tambah Pemasukan Baru */}
        <div className="p-6 pt-3">
          <form onSubmit={handleAddPayment} className="bg-slate-900/90 border border-amber-500/20 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>+ Catat Pemasukan / Angsuran Baru</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Tanggal Bayar
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-1 focus:ring-amber-400 outline-hidden font-mono-numbers"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Nominal Diterima (Rp)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={jumlahText}
                    onChange={(e) => setJumlahText(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 50.000"
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-amber-300 font-bold focus:ring-1 focus:ring-amber-400 outline-hidden font-mono-numbers"
                  />
                  <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catatan / Metode (Contoh: Transfer BCA, Titip Cash)"
                className="flex-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-1 focus:ring-amber-400 outline-hidden"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-sm transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simpan Bayar</span>
              </button>
            </div>
          </form>

          {/* List Riwayat Pembayaran Setiap Tanggal */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Riwayat Pembayaran Tiap Tanggal
              </h3>
              <span className="text-xs font-mono-numbers text-slate-400">
                {paymentsSorted.length} Catatan
              </span>
            </div>

            {paymentsSorted.length === 0 ? (
              <div className="py-8 text-center bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-1.5" />
                <p className="text-xs text-slate-400 font-medium">Belum ada catatan pemasukan</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Gunakan formulir di atas untuk mencatat pembayaran pertama
                </p>
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80 max-h-56 overflow-y-auto">
                {paymentsSorted.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-emerald-950/60 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white font-mono-numbers">
                          {formatRupiah(payment.jumlah)}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>{formatDateIndo(payment.tanggal)}</span>
                          {payment.catatan && (
                            <>
                              <span aria-hidden="true">&middot;</span>
                              <span className="truncate max-w-[200px] text-slate-300">{payment.catatan}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePayment(payment.id)}
                      title="Hapus pembayaran"
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-800 bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
