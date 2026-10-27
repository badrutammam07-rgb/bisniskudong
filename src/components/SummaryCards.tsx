import React from 'react';
import { ComputedMotorUnit } from '../types/motor';
import { formatRupiah } from '../utils/calculations';
import { Car, Coins, Wallet, Clock, AlertTriangle } from 'lucide-react';

interface SummaryCardsProps {
  units: ComputedMotorUnit[];
  selectedPemilikDana: string;
  onSelectPemilikDana: (pemilik: string) => void;
  onFilterLelang: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  units,
  selectedPemilikDana,
  onSelectPemilikDana,
  onFilterLelang,
}) => {
  // Only calculate based on active units (non-expired lunas)
  const activeUnits = units.filter((u) => !u.is_expired_lunas);

  const displayedUnits =
    selectedPemilikDana === 'all'
      ? activeUnits
      : activeUnits.filter((u) => u.pemilik_dana === selectedPemilikDana);

  const totalUnits = displayedUnits.length;
  const totalPokok = displayedUnits.reduce((acc, u) => acc + (u.nominal_pokok || 0), 0);
  const totalPemasukan = displayedUnits.reduce((acc, u) => acc + u.total_pemasukan, 0);
  const totalPiutangParkir = displayedUnits.reduce((acc, u) => acc + u.jasa_parkir_belum_bayar, 0);
  const lelangUnitsCount = displayedUnits.filter((u) => u.display_status === 'Lelang').length;

  // Breakdown per Pemilik Dana
  const breakdownPribadi = activeUnits
    .filter((u) => u.pemilik_dana === 'Pribadi')
    .reduce((acc, u) => acc + (u.nominal_pokok || 0), 0);
  const countPribadi = activeUnits.filter((u) => u.pemilik_dana === 'Pribadi').length;

  const breakdownMamah = activeUnits
    .filter((u) => u.pemilik_dana === 'Mamah')
    .reduce((acc, u) => acc + (u.nominal_pokok || 0), 0);
  const countMamah = activeUnits.filter((u) => u.pemilik_dana === 'Mamah').length;

  const breakdownPecel = activeUnits
    .filter((u) => u.pemilik_dana === 'Pecel')
    .reduce((acc, u) => acc + (u.nominal_pokok || 0), 0);
  const countPecel = activeUnits.filter((u) => u.pemilik_dana === 'Pecel').length;

  return (
    <section id="ringkasan-dana" className="mb-6">
      {/* Top Stat Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Unit Aktif */}
        <div className="luxury-card rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold tracking-widest uppercase">Portofolio Unit</span>
            <Car className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono-numbers">{totalUnits}</span>
            <span className="text-xs text-slate-400">Unit Aktif</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Kendaraan terparkir &amp; dikelola
          </p>
        </div>

        {/* Card 2: Total Modal Pokok */}
        <div className="luxury-card rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold tracking-widest uppercase">Total Modal Pokok</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black gold-gradient-text font-mono-numbers">
            {formatRupiah(totalPokok)}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Akumulasi modal uang muka berjalan
          </p>
        </div>

        {/* Card 3: Total Pemasukan Jasa Parkir */}
        <div className="luxury-card rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold tracking-widest uppercase">Pemasukan Diterima</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono-numbers">
            {formatRupiah(totalPemasukan)}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Sisa Piutang:</span>
            <span className="font-semibold text-amber-300 font-mono-numbers">
              {formatRupiah(totalPiutangParkir)}
            </span>
          </div>
        </div>

        {/* Card 4: Unit Status Lelang */}
        <div
          onClick={onFilterLelang}
          className={`luxury-card rounded-xl p-5 relative overflow-hidden group cursor-pointer transition-all ${
            lelangUnitsCount > 0
              ? 'border-rose-500/40 bg-gradient-to-br from-rose-950/30 to-slate-900/90 hover:border-rose-400'
              : 'hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-semibold tracking-widest uppercase ${
              lelangUnitsCount > 0 ? 'text-rose-400' : 'text-slate-400'
            }`}>
              Unit Lelang (&gt; 90 Hari Parkir)
            </span>
            <AlertTriangle className={`w-4 h-4 ${lelangUnitsCount > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono-numbers ${
              lelangUnitsCount > 0 ? 'text-rose-400' : 'text-slate-200'
            }`}>
              {lelangUnitsCount}
            </span>
            <span className="text-xs text-slate-400">Unit Siap Lelang</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {lelangUnitsCount > 0
              ? 'Jasa belum bayar melebihi 90 hari tarif parkir'
              : 'Belum ada unit melebihi 90 hari tarif parkir'}
          </p>
        </div>
      </div>

      {/* Breakdown Berdasarkan Pemilik Dana (Pribadi, Mamah, Pecel) */}
      <div className="mt-4 luxury-card rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Distribusi Modal Pemilik Dana
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Klik nama pemilik untuk memfilter unit secara instan
            </p>
          </div>
          {selectedPemilikDana !== 'all' && (
            <button
              onClick={() => onSelectPemilikDana('all')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold self-start sm:self-auto cursor-pointer"
            >
              Tampilkan Semua Pemilik
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Pribadi */}
          <button
            type="button"
            onClick={() => onSelectPemilikDana(selectedPemilikDana === 'Pribadi' ? 'all' : 'Pribadi')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedPemilikDana === 'Pribadi'
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-700/30 border-amber-500/50 text-white shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">Dana Pribadi</span>
              <span className="font-mono-numbers text-slate-400">
                {countPribadi} Unit
              </span>
            </div>
            <div className="mt-1.5 text-lg font-bold font-mono-numbers text-amber-300">
              {formatRupiah(breakdownPribadi)}
            </div>
          </button>

          {/* Mamah */}
          <button
            type="button"
            onClick={() => onSelectPemilikDana(selectedPemilikDana === 'Mamah' ? 'all' : 'Mamah')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedPemilikDana === 'Mamah'
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-700/30 border-amber-500/50 text-white shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">Dana Mamah</span>
              <span className="font-mono-numbers text-slate-400">
                {countMamah} Unit
              </span>
            </div>
            <div className="mt-1.5 text-lg font-bold font-mono-numbers text-amber-300">
              {formatRupiah(breakdownMamah)}
            </div>
          </button>

          {/* Pecel */}
          <button
            type="button"
            onClick={() => onSelectPemilikDana(selectedPemilikDana === 'Pecel' ? 'all' : 'Pecel')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedPemilikDana === 'Pecel'
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-700/30 border-amber-500/50 text-white shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">Dana Pecel</span>
              <span className="font-mono-numbers text-slate-400">
                {countPecel} Unit
              </span>
            </div>
            <div className="mt-1.5 text-lg font-bold font-mono-numbers text-amber-300">
              {formatRupiah(breakdownPecel)}
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};
