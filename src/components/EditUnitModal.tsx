import React, { useState, useEffect, useMemo } from 'react';
import { MotorUnit, PemilikDana, UnitStatus, Penggadai } from '../types/motor';
import { X, Calendar, User, Phone, FileText, DollarSign, CreditCard, MapPin, Sparkles, Search, CheckCircle2 } from 'lucide-react';
import { formatNominalInput, parseNominalInput } from '../utils/calculations';

interface EditUnitModalProps {
  unit: MotorUnit | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUnit: (updated: MotorUnit) => void;
  penggadaiList?: Penggadai[];
}

export const EditUnitModal: React.FC<EditUnitModalProps> = ({
  unit,
  isOpen,
  onClose,
  onUpdateUnit,
  penggadaiList = [],
}) => {
  const [tanggalMasuk, setTanggalMasuk] = useState('');
  const [jenisMotor, setJenisMotor] = useState('');
  const [tahun, setTahun] = useState<number>(2023);
  const [nopol, setNopol] = useState('');
  const [namaPemilik, setNamaPemilik] = useState('');
  const [nik, setNik] = useState('');
  const [alamat, setAlamat] = useState('');
  const [noWhatsapp, setNoWhatsapp] = useState('');
  const [noStruk, setNoStruk] = useState('');
  const [jasaParkirText, setJasaParkirText] = useState('');
  const [nominalPokokText, setNominalPokokText] = useState('');
  const [pemilikDana, setPemilikDana] = useState<PemilikDana>('Pribadi');
  const [customPemilikDana, setCustomPemilikDana] = useState('');
  const [isCustomPemilik, setIsCustomPemilik] = useState(false);
  const [status, setStatus] = useState<UnitStatus>('Parkir');
  const [catatan, setCatatan] = useState('');
  const [searchPenggadaiQuery, setSearchPenggadaiQuery] = useState('');

  // Filter daftar penggadai terdaftar agar bisa di-scroll down
  const filteredExistingPenggadai = useMemo(() => {
    if (!searchPenggadaiQuery.trim()) return penggadaiList;
    const q = searchPenggadaiQuery.toLowerCase();
    return penggadaiList.filter((p) => {
      const matchNama = (p.nama || '').toLowerCase().includes(q);
      const matchNik = (p.nik || '').toLowerCase().includes(q);
      const matchWa = (p.no_whatsapp || '').toLowerCase().includes(q);
      const matchAlamat = (p.alamat || '').toLowerCase().includes(q);
      return matchNama || matchNik || matchWa || matchAlamat;
    });
  }, [penggadaiList, searchPenggadaiQuery]);

  const applyPenggadai = (p: Penggadai) => {
    setNamaPemilik(p.nama.toUpperCase());
    setNik(p.nik || '');
    setAlamat(p.alamat || '');
    setNoWhatsapp(p.no_whatsapp || '');
  };

  useEffect(() => {
    if (unit) {
      setTanggalMasuk(unit.tanggal_masuk || '');
      setJenisMotor(unit.jenis_motor || '');
      setTahun(unit.tahun || 2023);
      setNopol((unit.nopol || '').toUpperCase());
      setNamaPemilik((unit.nama_pemilik || '').toUpperCase());
      setNik(unit.nik || '');
      setAlamat(unit.alamat || '');
      setNoWhatsapp(unit.no_whatsapp || '');
      setNoStruk(unit.no_struk || '');
      setJasaParkirText(formatNominalInput(unit.jasa_parkir || 0));
      setNominalPokokText(formatNominalInput(unit.nominal_pokok || 0));
      setStatus(unit.status || 'Parkir');
      setCatatan(unit.catatan || '');

      if (['Pribadi', 'Mamah', 'Pecel'].includes(unit.pemilik_dana)) {
        setPemilikDana(unit.pemilik_dana);
        setIsCustomPemilik(false);
      } else {
        setIsCustomPemilik(true);
        setCustomPemilikDana(unit.pemilik_dana || '');
      }
    }
  }, [unit]);

  if (!isOpen || !unit) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!jenisMotor.trim() || !namaPemilik.trim() || !nopol.trim()) {
      alert('Mohon lengkapi jenis motor, nama penggadai, dan nomor polisi.');
      return;
    }

    const finalPemilikDana = isCustomPemilik ? (customPemilikDana.trim() || 'Pribadi') : pemilikDana;

    const updatedUnit: MotorUnit = {
      ...unit,
      no_struk: noStruk.trim() || unit.no_struk,
      tanggal_masuk: tanggalMasuk,
      jenis_motor: jenisMotor.trim(),
      tahun: Number(tahun) || 2023,
      nopol: nopol.trim().toUpperCase(),
      nama_pemilik: namaPemilik.trim().toUpperCase(),
      nik: nik.trim(),
      alamat: alamat.trim(),
      no_whatsapp: noWhatsapp.trim(),
      jasa_parkir: parseNominalInput(jasaParkirText),
      nominal_pokok: parseNominalInput(nominalPokokText),
      pemilik_dana: finalPemilikDana,
      status: status,
      catatan: catatan.trim(),
      updated_at: new Date().toISOString(),
    };

    onUpdateUnit(updatedUnit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="luxury-card bg-[#0d1424] border border-amber-500/30 rounded-2xl shadow-2xl w-full max-w-2xl my-4 sm:my-8 overflow-hidden text-slate-100 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <div className="min-w-0 pr-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="gold-gradient-text truncate">Edit Data Unit Motor</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
              Unit {unit.nopol} &mdash; {unit.jenis_motor}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
          {/* Baris 1: Tanggal Masuk & No Struk */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tanggal Masuk <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={tanggalMasuk}
                  onChange={(e) => setTanggalMasuk(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden font-mono-numbers"
                />
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Jatuh tempo otomatis berulang setiap tanggal {tanggalMasuk ? new Date(tanggalMasuk).getDate() : '-'} setiap bulan (pengingat H-2).
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nomor Struk
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={noStruk}
                  onChange={(e) => setNoStruk(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden font-mono-numbers uppercase"
                />
                <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Nomor bukti struk transaksi.
              </span>
            </div>
          </div>

          {/* Baris 2: Data Penggadai (Nama, NIK, Alamat, WA) */}
          <div className="p-4 bg-slate-900/80 border border-slate-700/80 rounded-xl space-y-3.5">
            <div className="text-xs font-bold text-amber-300 flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-400" />
                <span>Identitas Penggadai</span>
              </div>
              {penggadaiList.length > 0 && (
                <span className="text-[11px] text-slate-400 font-normal">
                  {penggadaiList.length} Penggadai Tersimpan
                </span>
              )}
            </div>

            {/* Quick Picker dari Penggadai Terdaftar dengan Scroll Down */}
            {penggadaiList.length > 0 && (
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Perbarui dari Data Penggadai Tersimpan (Dropdown / Scroll Down):</span>
                  </label>
                  <select
                    onChange={(e) => {
                      const found = penggadaiList.find((p) => p.id === e.target.value);
                      if (found) applyPenggadai(found);
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden font-medium cursor-pointer"
                  >
                    <option value="">-- Scroll down untuk memilih data penggadai tersimpan ({penggadaiList.length} orang) --</option>
                    {penggadaiList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama} {p.nik ? `| NIK: ${p.nik}` : ''} {p.no_whatsapp ? `| WA: ${p.no_whatsapp}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-1.5 border-t border-slate-800/80 space-y-1.5">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchPenggadaiQuery}
                      onChange={(e) => setSearchPenggadaiQuery(e.target.value)}
                      placeholder="Cari nama / NIK penggadai tersimpan..."
                      className="w-full pl-8 pr-3 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:ring-1 focus:ring-amber-400 outline-hidden"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2 pointer-events-none" />
                  </div>

                  <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/80 divide-y divide-slate-800/80">
                    {filteredExistingPenggadai.map((p) => {
                      const isMatch = (namaPemilik || '').trim() === p.nama.trim();
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => applyPenggadai(p)}
                          className={`w-full p-2 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                            isMatch
                              ? 'bg-amber-400/20 text-amber-200 font-bold border-l-2 border-amber-400'
                              : 'hover:bg-slate-800/70 text-slate-300'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-semibold text-slate-100">{p.nama}</span>
                            <div className="text-[10px] text-slate-400 truncate">
                              {p.nik ? `NIK: ${p.nik}` : ''} {p.no_whatsapp ? `• WA: ${p.no_whatsapp}` : ''} {p.alamat ? `• ${p.alamat}` : ''}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-medium shrink-0 ${
                              isMatch ? 'bg-amber-400 text-slate-950 font-bold' : 'text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {isMatch ? 'Dipakai' : 'Gunakan'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Penggadai <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={namaPemilik}
                    onChange={(e) => setNamaPemilik(e.target.value.toUpperCase())}
                    placeholder="NAMA LENGKAP PENGGADAI"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden uppercase font-semibold tracking-wide"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nomor Induk Kependudukan (NIK KTP)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="16 Digit NIK KTP"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden font-mono tracking-wider"
                  />
                  <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Alamat Penggadai
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Contoh: Jl. Melati No. 12"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden"
                  />
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nomor WhatsApp
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={noWhatsapp}
                    onChange={(e) => setNoWhatsapp(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden font-mono-numbers"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Baris 3: Jenis Motor, Tahun, Nopol */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Jenis / Tipe Motor <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={jenisMotor}
                onChange={(e) => setJenisMotor(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tahun
              </label>
              <input
                type="number"
                value={tahun}
                onChange={(e) => setTahun(parseInt(e.target.value) || 2023)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden font-mono-numbers"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nomor Polisi (Nopol) <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={nopol}
                onChange={(e) => setNopol(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-bold font-mono tracking-wider focus:ring-2 focus:ring-amber-400 outline-hidden uppercase"
              />
            </div>
          </div>

          {/* Baris 4: Finansial */}
          <div className="p-4 bg-slate-900/80 border border-amber-500/20 rounded-xl space-y-4">
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              <span>Finansial &amp; Kepemilikan Modal</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nominal Pokok (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={nominalPokokText}
                  onChange={(e) => setNominalPokokText(formatNominalInput(e.target.value))}
                  placeholder="Contoh: 3.000.000"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-amber-300 font-bold focus:ring-2 focus:ring-amber-400 outline-hidden font-mono-numbers"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Jasa Parkir / Hari (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={jasaParkirText}
                  onChange={(e) => setJasaParkirText(formatNominalInput(e.target.value))}
                  placeholder="Contoh: 5.000"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden font-mono-numbers"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pemilik Dana
                </label>
                {!isCustomPemilik ? (
                  <select
                    value={pemilikDana}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomPemilik(true);
                      } else {
                        setPemilikDana(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden"
                  >
                    <option value="Pribadi">Pribadi</option>
                    <option value="Mamah">Mamah</option>
                    <option value="Pecel">Pecel</option>
                    <option value="custom">+ Pemilik Lain...</option>
                  </select>
                ) : (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={customPemilikDana}
                      onChange={(e) => setCustomPemilikDana(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomPemilik(false)}
                      className="px-2 py-1 text-xs border border-slate-700 rounded-lg hover:bg-slate-800"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Status Operasional
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UnitStatus)}
                className="w-full sm:w-1/2 px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden"
              >
                <option value="Parkir">Parkir (Aktif)</option>
                <option value="Lelang">Lelang (Terkendala / Siap Lelang)</option>
                <option value="Lunas">Lunas (Selesai)</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Otomatis menjadi <strong className="text-rose-400">LELANG</strong> jika nominal jasa parkir belum dibayarkan &gt; (90 hari &times; tarif harian), dan otomatis <strong className="text-emerald-400">PARKIR</strong> jika belum melebihi.
              </span>
            </div>
          </div>

          {/* Baris 5: Catatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Catatan &amp; Kelengkapan
            </label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
