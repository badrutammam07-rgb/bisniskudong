import React from 'react';
import { Plus, Bell, Volume2, Cloud, RefreshCw, CloudOff } from 'lucide-react';
import { playLuxuryChime } from '../utils/sound';
import { SyncStatus } from '../firebase/units';

interface HeaderProps {
  onOpenAddModal: () => void;
  totalActiveUnits: number;
  totalDueAlerts: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  syncStatus: SyncStatus;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
  totalActiveUnits,
  totalDueAlerts,
  soundEnabled,
  onToggleSound,
  syncStatus,
  isRefreshing,
  onRefresh,
}) => {
  const handleTestChime = () => {
    playLuxuryChime();
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0b101b]/95 backdrop-blur-md border-b border-amber-500/20 shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-6">
          {/* Zone 1: Brand & Live Sync Status */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black text-base sm:text-xl shadow-lg shadow-amber-500/20 shrink-0">
              M
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <a href="/" className="text-base sm:text-xl font-bold tracking-tight text-white flex items-center gap-1">
                  <span className="gold-gradient-text">MOTORKU</span>
                </a>
                
                <span className="hidden md:inline-block text-[11px] font-mono-numbers px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-md whitespace-nowrap">
                  {totalActiveUnits} Unit Aktif
                </span>

                {/* Live Realtime Cloud Sync Badge */}
                {syncStatus === 'connected' && (
                  <span
                    title="Data tersinkronisasi otomatis secara realtime antar seluruh perangkat"
                    className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md whitespace-nowrap"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <Cloud className="w-3 h-3 text-emerald-400 hidden xs:inline" />
                    <span>Sinkron Realtime</span>
                  </span>
                )}

                {(syncStatus === 'syncing' || isRefreshing) && (
                  <span
                    title="Sedang menyinkronkan data terbaru..."
                    className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-md whitespace-nowrap"
                  >
                    <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
                    <span>Menyinkronkan...</span>
                  </span>
                )}

                {syncStatus === 'connecting' && !isRefreshing && (
                  <span
                    title="Menghubungkan ke database cloud..."
                    className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-md whitespace-nowrap"
                  >
                    <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                    <span className="hidden xs:inline">Menghubungkan...</span>
                  </span>
                )}

                {syncStatus === 'error' && (
                  <span
                    title="Mode offline, menggunakan data lokal tersimpan"
                    className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-md whitespace-nowrap"
                  >
                    <CloudOff className="w-3 h-3 text-rose-400" />
                    <span>Offline</span>
                  </span>
                )}

                {totalDueAlerts > 0 && (
                  <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-mono-numbers px-2 py-0.5 bg-blue-500/20 border border-blue-500/40 text-blue-300 rounded-md whitespace-nowrap">
                    <Bell className="w-3 h-3 text-blue-400" />
                    {totalDueAlerts} Unit H-2
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation & Sync Refresh / Sound Controls */}
          <nav className="hidden md:flex items-center gap-3 text-xs font-medium text-slate-300">
            {/* Manual Sync Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Segarkan data langsung dari database cloud"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/40 rounded-lg text-slate-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Memperbarui...' : 'Segarkan Data'}</span>
            </button>

            <button
              onClick={handleTestChime}
              title="Klik untuk menguji bunyi notifikasi bel di perangkat"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/40 rounded-lg text-slate-200 transition-all cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Tes Bunyi</span>
            </button>

            <button
              onClick={onToggleSound}
              title="Aktifkan / Matikan suara notifikasi otomatis"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Suara: {soundEnabled ? 'Aktif' : 'Mute'}</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action & Mobile Quick Sync/Audio */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Segarkan Data Cloud"
              className="md:hidden p-1.5 sm:p-2 text-slate-200 bg-slate-900 border border-slate-700 hover:border-amber-500/40 rounded-lg cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleTestChime}
              title="Uji Bunyi Gadget"
              className="md:hidden p-1.5 sm:p-2 text-amber-400 bg-slate-900 border border-amber-500/30 rounded-lg cursor-pointer hover:bg-slate-800"
            >
              <Bell className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenAddModal}
              title="Input Data Unit Motor Baru"
              className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-md shadow-amber-500/25 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">Input Data Baru</span>
              <span className="sm:hidden text-xs whitespace-nowrap">Input Baru</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
