import React, { useState, useMemo } from 'react';
import { Penggadai, ComputedMotorUnit } from '../types/motor';
import { X, User, Phone, MapPin, CreditCard, Search, Plus, Bike, ExternalLink, ShieldCheck, Check } from 'lucide-react';

interface PenggadaiModalProps {
  isOpen: boolean;
  onClose: () => void;
  penggadaiList: Penggadai[];
  units: ComputedMotorUnit[];
  onSelectForNewPawn: (penggadai: Penggadai) => void;
  onSavePenggadai: (penggadai: Partial<Penggadai> & { nama: string }) => Promise<void>;
}

export const PenggadaiModal: React.FC<PenggadaiModalProps> = ({
  isOpen,
  onClose,
  penggadaiList,
  units,
  onSelectForNewPawn,
  onSavePenggadai,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [nama, setNama] = useState('');
  const [nik, setNik] = useState('');
  const [alamat, setAlamat] = useState('');
  const [noWhatsapp, setNoWhatsapp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Filter penggadai berdasarkan pencarian nama / NIK / no WA / alamat
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return penggadaiList;
    const q = searchQuery.toLowerCase();
    return penggadaiList.filter((p) => {
      const matchNama = (p.nama || '').toLowerCase().includes(q);
      const matchNik = (p.nik || '').toLowerCase().includes(q);
      const matchAlamat = (p.alamat || '').toLowerCase().includes(q);
      const matchWa = (p.no_whatsapp || '').toLowerCase().includes(q);
      return matchNama || matchNik || matchAlamat || matchWa;
    });
  }, [penggadaiList, searchQuery]);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingId(null);
    setNama('');
    setNik('');
    setAlamat('');
    setNoWhatsapp('');
    setIsAddingNew(true);
  };

  const handleStartEdit = (p: Penggadai) => {
    setEditingId(p.id);
    setNama(p.nama);
    setNik(p.nik || '');
    setAlamat(p.alamat || '');
    setNoWhatsapp(p.no_whatsapp || '');
    setIsAddingNew(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      alert('Nama penggadai wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSavePenggadai({
        id: editingId || undefined,
        nama: nama.trim().toUpperCase(),
        nik: nik.trim(),
        alamat: alamat.trim(),
        no_whatsapp: noWhatsapp.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setIsAddingNew(false);
        setEditingId(null);
      }, 1000);
    } catch (err) {
      console.error('Gagal menyimpan penggadai:', err);
      alert('Gagal menyimpan penggadai ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="luxury-card bg-[#0d1424] border border-amber-500/30 rounded-2xl shadow-2xl w-full max-w-2xl my-4 sm:my-8 overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-800 bg-slate-900/70 shrink-0">
          <div className="min-w-0 pr-2">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="gold-gradient-text truncate">Direktori Penggadai Terdaftar</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
              Data penggadai tersimpan permanen di database &mdash; siap autofill saat gadai kembali
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Top Bar: Search and Add Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, NIK, alamat, atau no. WA..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400 outline-hidden"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            <button
              onClick={handleStartAdd}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Penggadai Baru</span>
            </button>
          </div>

          {/* Form Tambah / Edit Penggadai jika aktif */}
          {isAddingNew && (
            <form onSubmit={handleSubmit} className="p-4 bg-slate-900/90 border border-amber-500/40 rounded-xl space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-amber-300">
                  {editingId ? 'Edit Data Penggadai' : 'Tambah Penggadai Baru ke Database'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Nama Penggadai <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value.toUpperCase())}
                    placeholder="NAMA LENGKAP PENGGADAI"
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 uppercase font-semibold focus:ring-1 focus:ring-amber-400 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    NIK KTP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="16 Digit NIK"
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono focus:ring-1 focus:ring-amber-400 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Alamat Lengkap
                  </label>
                  <input
                    type="text"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Alamat tempat tinggal penggadai"
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-1 focus:ring-amber-400 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Nomor WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={noWhatsapp}
                    onChange={(e) => setNoWhatsapp(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono-numbers focus:ring-1 focus:ring-amber-400 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Tersimpan!</span>
                    </>
                  ) : (
                    <span>{editingId ? 'Simpan Perubahan' : 'Daftarkan Penggadai'}</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* List Daftar Penggadai */}
          <div className="space-y-2.5">
            {filteredList.length === 0 ? (
              <div className="py-12 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                <User className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-400">Tidak ada penggadai ditemukan</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Penggadai yang menginput unit otomatis tersimpan permanen di sini.
                </p>
              </div>
            ) : (
              filteredList.map((p) => {
                // Cari berapa unit yang sedang aktif digadaikan oleh penggadai ini
                const activeUnits = units.filter(
                  (u) =>
                    (u.nama_pemilik || '').toUpperCase().trim() === p.nama.toUpperCase().trim() &&
                    !u.is_expired_lunas
                );

                return (
                  <div
                    key={p.id}
                    className="p-3.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-xs sm:text-sm tracking-wide">
                          {p.nama}
                        </span>
                        {activeUnits.length > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-500/30 font-mono-numbers">
                            {activeUnits.length} Unit Aktif
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] text-slate-500 bg-slate-800">
                            Riwayat Lunas
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                        {p.nik && (
                          <span className="font-mono flex items-center gap-1 text-slate-300">
                            <CreditCard className="w-3 h-3 text-slate-500" />
                            <span>NIK: {p.nik}</span>
                          </span>
                        )}
                        {p.no_whatsapp && (
                          <span className="font-mono-numbers flex items-center gap-1 text-emerald-400">
                            <Phone className="w-3 h-3" />
                            <span>{p.no_whatsapp}</span>
                          </span>
                        )}
                      </div>

                      {p.alamat && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate max-w-md">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{p.alamat}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions: Gadaikan Unit Baru & Edit */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(p)}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                        title="Edit data identitas penggadai"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectForNewPawn(p);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-sm transition-all cursor-pointer"
                        title="Gadaikan unit motor baru untuk penggadai ini (data pribadi terisi otomatis)"
                      >
                        <Bike className="w-3.5 h-3.5" />
                        <span>Gadaikan Unit</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Modal */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-900/60 shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Data penggadai tetap tersimpan di database meskipun unit motor telah lunas dan dihapus.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
