import React, { useState, useMemo } from 'react';
import { ComputedMotorUnit, StatusFilter, TempoFilter } from '../types/motor';
import { formatDateIndo, formatRupiah, cleanWhatsAppNumber, generateTempoReminderWA } from '../utils/calculations';
import {
  Search,
  Send,
  Receipt,
  Edit2,
  CheckCircle,
  Trash2,
  Calendar,
  AlertTriangle,
  Archive,
  BellRing,
  Clock,
  Image as ImageIcon,
} from 'lucide-react';

interface UnitTableProps {
  units: ComputedMotorUnit[];
  statusFilter: StatusFilter;
  onChangeStatusFilter: (status: StatusFilter) => void;
  tempoFilter: TempoFilter;
  selectedPemilikDana: string;
  onChangePemilikDana: (pemilik: string) => void;
  onOpenReceipt: (unit: ComputedMotorUnit) => void;
  onOpenPayments: (unit: ComputedMotorUnit) => void;
  onOpenEdit: (unit: ComputedMotorUnit) => void;
  onOpenLunasConfirm: (unit: ComputedMotorUnit) => void;
  onDeleteUnit: (unitId: string) => void;
  onRequestDelete?: (unit: ComputedMotorUnit) => void;
}

export const UnitTable: React.FC<UnitTableProps> = ({
  units,
  statusFilter,
  onChangeStatusFilter,
  tempoFilter,
  selectedPemilikDana,
  onChangePemilikDana,
  onOpenReceipt,
  onOpenPayments,
  onOpenEdit,
  onOpenLunasConfirm,
  onDeleteUnit,
  onRequestDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'days_desc' | 'pokok_desc' | 'sisa_desc' | 'tempo_asc'>('tempo_asc');

  // Filtered units
  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      // 1. Status Filter
      if (statusFilter === 'aktif') {
        if (unit.is_expired_lunas) return false;
      } else if (statusFilter === 'arsip_lunas') {
        if (!unit.is_expired_lunas) return false;
      } else if (statusFilter === 'Parkir') {
        if (unit.display_status !== 'Parkir' || unit.is_expired_lunas) return false;
      } else if (statusFilter === 'Lelang') {
        if (unit.display_status !== 'Lelang' || unit.is_expired_lunas) return false;
      } else if (statusFilter === 'Lunas') {
        if (unit.status !== 'Lunas') return false;
      }

      // 2. Tempo Shortcut Filter (H-0, H-1, H-2, Lewat)
      if (tempoFilter !== 'semua') {
        if (unit.is_expired_lunas || unit.status === 'Lunas') return false;
        if (tempoFilter === 'H-0' && unit.kategori_tempo !== 'H-0') return false;
        if (tempoFilter === 'H-1' && unit.kategori_tempo !== 'H-1') return false;
        if (tempoFilter === 'H-2' && unit.kategori_tempo !== 'H-2') return false;
        if (tempoFilter === 'lewat' && unit.kategori_tempo !== 'Lewat') return false;
      }

      // 3. Pemilik Dana Filter
      if (selectedPemilikDana !== 'all' && unit.pemilik_dana !== selectedPemilikDana) {
        return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNopol = unit.nopol.toLowerCase().includes(q);
        const matchNama = unit.nama_pemilik.toLowerCase().includes(q);
        const matchMotor = unit.jenis_motor.toLowerCase().includes(q);
        const matchStruk = (unit.no_struk || '').toLowerCase().includes(q);
        const matchNik = (unit.nik || '').toLowerCase().includes(q);
        const matchAlamat = (unit.alamat || '').toLowerCase().includes(q);
        return matchNopol || matchNama || matchMotor || matchStruk || matchNik || matchAlamat;
      }

      return true;
    });
  }, [units, statusFilter, tempoFilter, selectedPemilikDana, searchQuery]);

  // Sorted units
  const sortedUnits = useMemo(() => {
    return [...filteredUnits].sort((a, b) => {
      if (sortBy === 'tempo_asc') {
        return a.sisa_hari_jatuh_tempo - b.sisa_hari_jatuh_tempo;
      }
      if (sortBy === 'date_desc') {
        return new Date(b.tanggal_masuk).getTime() - new Date(a.tanggal_masuk).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.tanggal_masuk).getTime() - new Date(b.tanggal_masuk).getTime();
      }
      if (sortBy === 'days_desc') {
        return b.jumlah_hari - a.jumlah_hari;
      }
      if (sortBy === 'pokok_desc') {
        return (b.nominal_pokok || 0) - (a.nominal_pokok || 0);
      }
      if (sortBy === 'sisa_desc') {
        return b.jasa_parkir_belum_bayar - a.jasa_parkir_belum_bayar;
      }
      return 0;
    });
  }, [filteredUnits, sortBy]);

  // Counts for tabs
  const activeCount = units.filter((u) => !u.is_expired_lunas).length;
  const lelangCount = units.filter((u) => !u.is_expired_lunas && u.display_status === 'Lelang').length;
  const expiredCount = units.filter((u) => u.is_expired_lunas).length;

  return (
    <section id="tabel-unit" className="luxury-card rounded-xl overflow-hidden shadow-2xl">
      {/* Top Filter and Search Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => onChangeStatusFilter('aktif')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'aktif'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Unit Aktif ({activeCount})
            </button>
            <button
              onClick={() => onChangeStatusFilter('Parkir')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'Parkir'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Parkir
            </button>
            <button
              onClick={() => onChangeStatusFilter('Lelang')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'Lelang'
                  ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-600/30'
                  : lelangCount > 0
                  ? 'text-rose-400 font-semibold hover:bg-rose-950/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Lelang {lelangCount > 0 && `(${lelangCount})`}
            </button>
            <button
              onClick={() => onChangeStatusFilter('Lunas')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'Lunas'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Lunas
            </button>
            <button
              onClick={() => onChangeStatusFilter('arsip_lunas')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                statusFilter === 'arsip_lunas'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Arsip Lunas ({expiredCount})</span>
            </button>
            <button
              onClick={() => onChangeStatusFilter('semua')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'semua'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua ({units.length})
            </button>
          </div>
        </div>

        {/* Search, Pemilik Dana, & Sort Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nopol, nama pemilik, jenis motor, no struk..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-hidden"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Pemilik Dana Selector */}
          <div className="sm:col-span-4">
            <select
              value={selectedPemilikDana}
              onChange={(e) => onChangePemilikDana(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-amber-400 outline-hidden"
            >
              <option value="all">Semua Pemilik Dana</option>
              <option value="Pribadi">Modal Pribadi</option>
              <option value="Mamah">Modal Mamah</option>
              <option value="Pecel">Modal Pecel</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-amber-400 outline-hidden"
            >
              <option value="tempo_asc">Urutkan: Jatuh Tempo Terdekat</option>
              <option value="date_desc">Tgl Masuk Terbaru</option>
              <option value="date_asc">Tgl Masuk Terlama</option>
              <option value="days_desc">Durasi Hari Terlama</option>
              <option value="pokok_desc">Nominal Pokok Terbesar</option>
              <option value="sisa_desc">Sisa Tagihan Terbesar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Struk &amp; Masuk</th>
              <th className="py-3 px-4">Unit Motor</th>
              <th className="py-3 px-4">Penggadai &amp; Kontak</th>
              <th className="py-3 px-4">Pemilik Dana</th>
              <th className="py-3 px-3 text-center">Hari</th>
              <th className="py-3 px-3 text-center">Jatuh Tempo</th>
              <th className="py-3 px-4 text-right">Jasa Parkir</th>
              <th className="py-3 px-4 text-right">Pemasukan</th>
              <th className="py-3 px-4 text-right">Pokok</th>
              <th className="py-3 px-4 text-right">Total Tebus</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-4 text-center">Aksi Unit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {sortedUnits.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="font-semibold text-slate-300">Tidak ada unit motor ditemukan</p>
                    <p className="text-xs text-slate-500">
                      Sesuaikan filter pencarian atau input unit motor baru.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedUnits.map((unit) => {
                const waClean = cleanWhatsAppNumber(unit.no_whatsapp);
                const reminderText = generateTempoReminderWA(unit);
                const reminderLink = `https://wa.me/${waClean}?text=${encodeURIComponent(reminderText)}`;

                // Tempo badge styling
                let tempoBadge = null;
                if (unit.status !== 'Lunas') {
                  if (unit.kategori_tempo === 'H-0') {
                    tempoBadge = (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded flex items-center gap-1 justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                        H-0 (Hari Ini)
                      </span>
                    );
                  } else if (unit.kategori_tempo === 'H-1') {
                    tempoBadge = (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded flex items-center gap-1 justify-center">
                        <Clock className="w-3 h-3" />
                        H-1 (Besok)
                      </span>
                    );
                  } else if (unit.kategori_tempo === 'H-2') {
                    tempoBadge = (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded flex items-center gap-1 justify-center">
                        H-2 (Lusa)
                      </span>
                    );
                  } else if (unit.kategori_tempo === 'Lewat') {
                    tempoBadge = (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-950/60 text-red-300 border border-red-800/50 rounded flex items-center gap-1 justify-center">
                        Lewat Tempo
                      </span>
                    );
                  } else {
                    tempoBadge = (
                      <span className="text-[10px] text-slate-500">
                        {unit.sisa_hari_jatuh_tempo} hr lagi
                      </span>
                    );
                  }
                }

                return (
                  <tr
                    key={unit.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      unit.kategori_tempo === 'H-2' && unit.status !== 'Lunas'
                        ? 'bg-blue-950/25 border-l-2 border-l-blue-400'
                        : unit.kategori_tempo === 'H-0' && unit.status !== 'Lunas'
                        ? 'bg-rose-950/20'
                        : unit.display_status === 'Lelang'
                        ? 'bg-red-950/20'
                        : ''
                    }`}
                  >
                    {/* Struk & Tanggal Masuk */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-amber-300 font-mono-numbers">
                        {unit.no_struk || '-'}
                      </div>
                      <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{formatDateIndo(unit.tanggal_masuk)}</span>
                      </div>
                    </td>

                    {/* Unit Motor */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-white whitespace-nowrap tracking-wide font-mono text-sm">
                        {unit.nopol}
                      </div>
                      <div className="text-slate-300 text-[11px] whitespace-nowrap mt-0.5">
                        {unit.jenis_motor} ({unit.tahun})
                      </div>
                    </td>

                    {/* Penggadai (Nama, NIK, Alamat & WhatsApp) */}
                    <td className="py-3 px-4 min-w-[170px]">
                      <div className="font-semibold text-slate-100 whitespace-nowrap">
                        {unit.nama_pemilik}
                      </div>
                      {unit.nik && (
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <span className="text-slate-500 font-medium">NIK:</span>
                          <span>{unit.nik}</span>
                        </div>
                      )}
                      {unit.alamat && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[190px] mt-0.5" title={unit.alamat}>
                          {unit.alamat}
                        </div>
                      )}
                      {unit.no_whatsapp ? (
                        <a
                          href={`https://wa.me/${waClean}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 text-[11px] font-mono-numbers inline-flex items-center gap-1 mt-0.5"
                          title="Buka chat WhatsApp"
                        >
                          <span>{unit.no_whatsapp}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-500">-</span>
                      )}
                    </td>

                    {/* Pemilik Dana */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-medium text-amber-200">
                        {unit.pemilik_dana}
                      </span>
                    </td>

                    {/* Hari */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="font-bold font-mono-numbers text-white text-sm">
                        {unit.jumlah_hari}
                      </div>
                      <span className="text-[10px] text-slate-400">Hari</span>
                    </td>

                    {/* Jatuh Tempo & Shortcut Alert */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="font-mono-numbers text-[11px] text-slate-300">
                        {formatDateIndo(unit.tanggal_jatuh_tempo)}
                      </div>
                      <div className="mt-1 flex items-center justify-center gap-1">
                        {tempoBadge}
                        {unit.status !== 'Lunas' && ['H-0', 'H-1', 'H-2', 'Lewat'].includes(unit.kategori_tempo) && (
                          <a
                            href={reminderLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Kirim Pengingat WA ${unit.kategori_tempo} (tanpa membocorkan modal)`}
                            className="p-1 text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded"
                          >
                            <BellRing className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Jasa Parkir */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="font-semibold text-slate-200 font-mono-numbers">
                        {formatRupiah(unit.total_jasa_parkir)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono-numbers">
                        @{formatRupiah(unit.jasa_parkir)}/hr
                      </div>
                    </td>

                    {/* Pemasukan */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onOpenPayments(unit)}
                        className="group text-right cursor-pointer"
                        title="Klik untuk melihat detail setiap tanggal pembayaran"
                      >
                        <div className="font-bold text-emerald-400 font-mono-numbers group-hover:underline">
                          {formatRupiah(unit.total_pemasukan)}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                          <span>{unit.pemasukan_detail?.length || 0}x bayar</span>
                          <span className="text-amber-400 font-medium group-hover:underline">Detail &rarr;</span>
                        </div>
                      </button>
                    </td>

                    {/* Nominal Pokok */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="font-bold text-slate-200 font-mono-numbers">
                        {formatRupiah(unit.nominal_pokok)}
                      </div>
                    </td>

                    {/* Total Tebus */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="font-bold gold-gradient-text font-mono-numbers text-sm">
                        {formatRupiah(unit.total_penebusan)}
                      </div>
                      <div className="text-[10px] text-amber-300 font-mono-numbers">
                        Sisa: {formatRupiah(unit.jasa_parkir_belum_bayar)}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {unit.display_status === 'Lelang' ? (
                        <div
                          className="inline-flex flex-col items-center"
                          title={`Sisa jasa parkir belum dibayarkan (${formatRupiah(unit.jasa_parkir_belum_bayar)}) melebihi batas 90 hari (${formatRupiah(unit.batas_nominal_lelang)})`}
                        >
                          <span className="px-2 py-0.5 text-[11px] font-bold text-rose-300 bg-rose-950/80 border border-rose-500/40 rounded">
                            Lelang
                          </span>
                          <span className="text-[9px] text-rose-400 mt-0.5 font-medium whitespace-nowrap">
                            Sisa &gt; 90 hr
                          </span>
                        </div>
                      ) : unit.display_status === 'Lunas' ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="px-2 py-0.5 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 rounded">
                            Lunas
                          </span>
                          {unit.is_expired_lunas && (
                            <span className="text-[9px] text-slate-400 mt-0.5">
                              Arsip (&gt;7 hr)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 text-[11px] font-medium text-slate-300 bg-slate-800 rounded border border-slate-700">
                          Parkir
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Tombol Foto Struk WA */}
                        <button
                          onClick={() => onOpenReceipt(unit)}
                          title="Lihat & kirim foto struk ke WhatsApp"
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Foto Struk</span>
                        </button>

                        {/* Tombol Lunas */}
                        {unit.status !== 'Lunas' && (
                          <button
                            onClick={() => onOpenLunasConfirm(unit)}
                            title="Tandai unit lunas"
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 rounded-lg transition-colors cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                            <span>Lunas</span>
                          </button>
                        )}

                        {/* Tombol Edit */}
                        <button
                          onClick={() => onOpenEdit(unit)}
                          title="Edit data unit"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Tombol Hapus */}
                        <button
                          onClick={() => {
                            if (onRequestDelete) {
                              onRequestDelete(unit);
                            } else {
                              onDeleteUnit(unit.id);
                            }
                          }}
                          title="Hapus permanen unit"
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* Table Footer info previously present here has been completely removed as requested */}
    </section>
  );
};
