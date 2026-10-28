import React, { useState, useEffect, useMemo } from 'react';
import { MotorUnit, PemilikDana, Penggadai } from '../types/motor';
import { X, Calendar, User, Phone, FileText, DollarSign, CreditCard, MapPin, Search, CheckCircle2, UserPlus, Sparkles } from 'lucide-react';
import { toISODateString, formatNominalInput, parseNominalInput } from '../utils/calculations';

interface AddUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUnit: (unit: MotorUnit) => void;
  existingCount: number;
  penggadaiList?: Penggadai[];
  preselectedPenggadai?: Penggadai | null;
}

export const AddUnitModal: React.FC<AddUnitModalProps> = ({
  isOpen,
  onClose,
  onAddUnit,
  existingCount,
  penggadaiList = [],
  preselectedPenggadai = null,
}) => {
  const now = new Date();
  const todayStr = toISODateString(now);
  const currentYear = now.getFullYear();

  // Auto-generate receipt number: MK-{YEAR}-{SEQ}
  const defaultStruk = `MK-${currentYear}-${String(existingCount + 1).padStart(3, '0')}`;

  const [tanggalMasuk, setTanggalMasuk] = useState(todayStr);
  const [jenisMotor, setJenisMotor] = useState('');
  const [tahun, setTahun] = useState<number>(currentYear);
  const [nopol, setNopol] = useState('');

  // Data Penggadai
  const [namaPemilik, setNamaPemilik] = useState('');
  const [nik, setNik] = useState('');
  const [alamat, setAlamat] = useState('');
  const [noWhatsapp, setNoWhatsapp] = useState('');

  // Mode Penggadai
  const [selectedPenggadaiId, setSelectedPenggadaiId] = useState<string>('');
  const [searchPenggadaiQuery, setSearchPenggadaiQuery] = useState('');
  const [isAutoFilled, setIsAutoFilled] = useState(false);

  const [noStruk, setNoStruk] = useState(defaultStruk);
  const [jasaParkirText, setJasaParkirText] = useState('5.000');
  const [nominalPokokText, setNominalPokokText] = useState('3.000.000');
  const [pemilikDana, setPemilikDana] = useState<PemilikDana>('Pribadi');
  const [customPemilikDana, setCustomPemilikDana] = useState('');
  const [isCustomPemilik, setIsCustomPemilik] = useState(false);
  const [catatan, setCatatan] = useState('');

  // Sinkronkan preselected penggadai jika dibuka dari direktori
  useEffect(() => {
    if (preselectedPenggadai) {
      applyPenggadai(preselectedPenggadai);
    } else {
      resetPenggadaiFields();
    }
  }, [preselectedPenggadai, isOpen]);

  const applyPenggadai = (p: Penggadai) => {
    setSelectedPenggadaiId(p.id);
    setNamaPemilik(p.nama.toUpperCase());
    setNik(p.nik || '');
    setAlamat(p.alamat || '');
    setNoWhatsapp(p.no_whatsapp || '');
    setIsAutoFilled(true);
  };

  const resetPenggadaiFields = () => {
    setSelectedPenggadaiId('');
    setNamaPemilik('');
    setNik('');
    setAlamat('');
    setNoWhatsapp('');
    setIsAutoFilled(false);
    setSearchPenggadaiQuery('');
  };

  // Filter daftar penggadai terdaftar (tampilkan semua agar bisa di-scroll down)
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

  // Cek jika NIK atau Nama yang diketik cocok persis dengan yang sudah terdaftar
  const handleNikChange = (val: string) => {
    const cleanDigits = val.replace(/\D/g, '').slice(0, 16);
    setNik(cleanDigits);

    // Cari otomatis jika NIK lengkap cocok
    if (cleanDigits.length >= 12) {
      const found = penggadaiList.find((p) => (p.nik || '').replace(/\D/g, '') === cleanDigits);
      if (found && found.id !== selectedPenggadaiId) {
        applyPenggadai(found);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaPemilik.trim()) {
      alert('Mohon masukkan Nama Penggadai.');
      return;
    }
    if (!jenisMotor.trim() || !nopol.trim()) {
      alert('Mohon lengkapi jenis motor dan nomor polisi kendaraan.');
      return;
    }

    const finalPemilikDana = isCustomPemilik ? customPemilikDana.trim() || 'Pribadi' : pemilikDana;

    const newUnit: MotorUnit = {
      id: 'unit-' + Date.now(),
      no_struk: noStruk.trim() || defaultStruk,
      tanggal_masuk: tanggalMasuk,
      jenis_motor: jenisMotor.trim(),
      tahun: Number(tahun) || currentYear,
      nopol: nopol.trim().toUpperCase(),
      nama_pemilik: namaPemilik.trim().toUpperCase(),
      nik: nik.trim(),
      alamat: alamat.trim(),
      no_whatsapp: noWhatsapp.trim(),
      jasa_parkir: parseNominalInput(jasaParkirText),
      nominal_pokok: parseNominalInput(nominalPokokText),
      pemilik_dana: finalPemilikDana,
      pemasukan_detail: [],
      status: 'Parkir',
      catatan: catatan.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onAddUnit(newUnit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="luxury-card bg-[#0d1424] border border-amber-500/30 rounded-2xl shadow-2xl w-full max-w-2xl my-4 sm:my-8 overflow-hidden text-slate-100 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <div className="min-w-0 pr-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="gold-gradient-text truncate">Input Data Unit Gadai Baru</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
              Data penggadai otomatis tersimpan permanen di database
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
          {/* SECTION 1: DATA PENGGADAI */}
          <div className="p-4 bg-slate-900/80 border border-amber-500/25 rounded-xl space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                <span>Data Penggadai (Nasabah)</span>
              </div>
              {penggadaiList.length > 0 && (
                <span className="text-[11px] text-slate-400">
                  {penggadaiList.length} Penggadai Terdaftar di Database
                </span>
              )}
            </div>

            {/* Quick Picker dari Penggadai Terdaftar dengan Scroll Down */}
            {penggadaiList.length > 0 && (
              <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-3">
                {/* 1. Menu Dropdown Select (Native Scroll Down) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pilih Penggadai Terdaftar (Dropdown / Scroll Down)</span>
                    </label>
                    {isAutoFilled && (
                      <button
                        type="button"
                        onClick={resetPenggadaiFields}
                        className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                      >
                        + Input Penggadai Baru
                      </button>
                    )}
                  </div>
                  <select
                    value={selectedPenggadaiId}
                    onChange={(e) => {
                      const found = penggadaiList.find((p) => p.id === e.target.value);
                      if (found) applyPenggadai(found);
                      else resetPenggadaiFields();
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden font-medium cursor-pointer"
                  >
                    <option value="">-- Scroll down untuk memilih penggadai ({penggadaiList.length} orang terdaftar) --</option>
                    {penggadaiList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama} {p.nik ? `| NIK: ${p.nik}` : ''} {p.no_whatsapp ? `| WA: ${p.no_whatsapp}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Daftar List dengan Scroll Down Vertikal */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Daftar Nama yang Sudah Terinput (Bisa Scroll Down):
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono-numbers">
                      {filteredExistingPenggadai.length} Penggadai
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={searchPenggadaiQuery}
                      onChange={(e) => setSearchPenggadaiQuery(e.target.value)}
                      placeholder="Ketik untuk menyaring nama / NIK / No. WA..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:ring-1 focus:ring-amber-400 outline-hidden"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2 pointer-events-none" />
                  </div>

                  {/* Container List yang bisa di-scroll down */}
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/80 divide-y divide-slate-800/80">
                    {filteredExistingPenggadai.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500">
                        Tidak ada penggadai yang cocok dengan "{searchPenggadaiQuery}"
                      </div>
                    ) : (
                      filteredExistingPenggadai.map((p) => {
                        const isSelected = selectedPenggadaiId === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => applyPenggadai(p)}
                            className={`w-full p-2.5 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-amber-400/20 text-amber-200 font-bold border-l-2 border-amber-400'
                                : 'hover:bg-slate-800/70 text-slate-300'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                                <span className="font-semibold text-slate-100">{p.nama}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                {p.nik ? `NIK: ${p.nik}` : ''} {p.no_whatsapp ? `• WA: ${p.no_whatsapp}` : ''} {p.alamat ? `• ${p.alamat}` : ''}
                              </div>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-medium shrink-0 ${
                                isSelected ? 'bg-amber-400 text-slate-950 font-bold' : 'text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {isSelected ? 'Terpilih' : 'Pilih'}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Banner data terisi otomatis */}
            {isAutoFilled && (
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Data Penggadai Terisi Otomatis:</strong> Anda tidak perlu mengetik ulang data pribadi. Cukup masukkan data unit motor di bawah.
                </span>
              </div>
            )}

            {/* Input Baris 1: Nama Penggadai & NIK */}
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
                    onChange={(e) => {
                      setNamaPemilik(e.target.value.toUpperCase());
                      setIsAutoFilled(false);
                    }}
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
                    onChange={(e) => handleNikChange(e.target.value)}
                    placeholder="16 Digit NIK KTP (Contoh: 31710123...)"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden font-mono tracking-wider"
                  />
                  <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Input Baris 2: Alamat & WhatsApp */}
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
                    placeholder="Contoh: Jl. Melati No. 12, RT 02/05, Jakarta"
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
                    placeholder="081234567890"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden font-mono-numbers"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: DATA KENDARAAN (UNIT MOTOR) */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <div className="text-xs font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Data Kendaraan &amp; Transaksi Unit</span>
            </div>

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
                    placeholder="MK-2024-001"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden font-mono-numbers uppercase"
                  />
                  <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Nomor struk otomatis sesuai urutan transaksi.
                </span>
              </div>
            </div>

            {/* Baris 2: Jenis Motor, Tahun, Nopol */}
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
                  placeholder="Contoh: Honda Vario 160"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tahun
                </label>
                <input
                  type="number"
                  min="1990"
                  max="2035"
                  value={tahun}
                  onChange={(e) => setTahun(parseInt(e.target.value) || currentYear)}
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
                  placeholder="B 1234 ABC"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-bold font-mono tracking-wider focus:ring-2 focus:ring-amber-400 outline-hidden uppercase"
                />
              </div>
            </div>

            {/* Baris 3: Finansial & Pemilik Dana */}
            <div className="p-3.5 bg-slate-950/70 border border-amber-500/20 rounded-xl space-y-3">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                <span>Finansial &amp; Kepemilikan Dana</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nominal Pokok (Rp) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={nominalPokokText}
                    onChange={(e) => setNominalPokokText(formatNominalInput(e.target.value))}
                    placeholder="3.000.000"
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-amber-300 font-bold focus:ring-2 focus:ring-amber-400 outline-hidden font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jasa Parkir / Hari (Rp) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={jasaParkirText}
                    onChange={(e) => setJasaParkirText(formatNominalInput(e.target.value))}
                    placeholder="5.000"
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Pemilik Dana <span className="text-amber-400">*</span>
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
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden"
                    >
                      <option value="Pribadi">Pribadi</option>
                      <option value="Mamah">Mamah</option>
                      <option value="Pecel">Pecel</option>
                      <option value="custom">+ Pemilik Lainnya...</option>
                    </select>
                  ) : (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Nama Pemilik Dana"
                        value={customPemilikDana}
                        onChange={(e) => setCustomPemilikDana(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden"
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
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    (Dirahasiakan dari struk WhatsApp)
                  </span>
                </div>
              </div>
            </div>

            {/* Baris 4: Catatan Kelengkapan */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Catatan &amp; Kelengkapan Unit
              </label>
              <textarea
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Kunci kontak 2 pcs, STNK asli, helm titipan."
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-400 outline-hidden"
              />
            </div>
          </div>

          {/* Footer Actions */}
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
              Simpan Unit Baru
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
