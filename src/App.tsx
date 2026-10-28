import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MotorUnit, ComputedMotorUnit, StatusFilter, TempoFilter, PaymentEntry, Penggadai } from './types/motor';
import { loadUnits, saveUnits, markUnitDeletedLocally, loadPenggadai, deletePenggadaiLocal } from './utils/storage';
import { computeUnit } from './utils/calculations';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { TempoShortcutBar } from './components/TempoShortcutBar';
import { UnitTable } from './components/UnitTable';
import { AddUnitModal } from './components/AddUnitModal';
import { EditUnitModal } from './components/EditUnitModal';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ConfirmLunasModal } from './components/ConfirmLunasModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { PenggadaiModal } from './components/PenggadaiModal';
import { playLuxuryChime, triggerDeviceNotification } from './utils/sound';
import {
  subscribeUnits,
  addUnitToFirestore,
  updateUnitInFirestore,
  deleteUnitFromFirestore,
  sanitizeUnit,
  forceRefreshUnitsFromFirestore,
  SyncStatus,
} from './firebase/units';
import { subscribePenggadai, upsertPenggadaiToFirestore, deletePenggadaiFromFirestore } from './firebase/penggadai';

export default function App() {
  const [units, setUnits] = useState<MotorUnit[]>(() => loadUnits());
  const [penggadaiList, setPenggadaiList] = useState<Penggadai[]>(() => loadPenggadai());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('aktif');
  const [tempoFilter, setTempoFilter] = useState<TempoFilter>('semua');
  const [selectedPemilikDana, setSelectedPemilikDana] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPenggadaiModalOpen, setIsPenggadaiModalOpen] = useState(false);
  const [preselectedPenggadai, setPreselectedPenggadai] = useState<Penggadai | null>(null);
  const [editingUnit, setEditingUnit] = useState<MotorUnit | null>(null);
  const [paymentUnit, setPaymentUnit] = useState<ComputedMotorUnit | null>(null);
  const [receiptUnit, setReceiptUnit] = useState<ComputedMotorUnit | null>(null);
  const [lunasUnit, setLunasUnit] = useState<ComputedMotorUnit | null>(null);
  const [deleteTargetUnit, setDeleteTargetUnit] = useState<ComputedMotorUnit | null>(null);

  // Compute all units with dynamic business rules
  const computedUnits = useMemo(() => {
    return units.map((u) => computeUnit(u));
  }, [units]);

  // Keep paymentUnit and receiptUnit up to date
  const activeReceiptUnit = useMemo(() => {
    if (!receiptUnit) return null;
    return computedUnits.find((u) => u.id === receiptUnit.id) || receiptUnit;
  }, [computedUnits, receiptUnit]);

  const activePaymentUnit = useMemo(() => {
    if (!paymentUnit) return null;
    return computedUnits.find((u) => u.id === paymentUnit.id) || paymentUnit;
  }, [computedUnits, paymentUnit]);

  // Subscribe to real-time updates from Firebase Firestore across all devices
  useEffect(() => {
    const unsubUnits = subscribeUnits(
      (remoteUnits) => {
        setUnits(remoteUnits);
      },
      (err) => {
        console.error('Firestore listener error:', err);
      },
      (status) => {
        setSyncStatus(status);
      }
    );

    const unsubPenggadai = subscribePenggadai((remotePenggadai) => {
      setPenggadaiList(remotePenggadai);
    });

    return () => {
      unsubUnits();
      unsubPenggadai();
    };
  }, []);

  // Tangani saat aplikasi dibuka kembali (misal buka tab baru / unlock layar ponsel)
  useEffect(() => {
    const handleRecheck = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        forceRefreshUnitsFromFirestore()
          .then((refreshed) => {
            setUnits(refreshed);
            setSyncStatus('connected');
          })
          .catch(() => {});
      }
    };

    window.addEventListener('online', handleRecheck);
    document.addEventListener('visibilitychange', handleRecheck);
    return () => {
      window.removeEventListener('online', handleRecheck);
      document.removeEventListener('visibilitychange', handleRecheck);
    };
  }, []);

  // Handle Manual Force Refresh
  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    setSyncStatus('syncing');
    try {
      const refreshed = await forceRefreshUnitsFromFirestore();
      setUnits(refreshed);
      setSyncStatus('connected');
    } catch (e) {
      console.warn('Gagal refresh langsung:', e);
      setSyncStatus('error');
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 400);
    }
  };

  // Handle Add Unit
  const handleAddUnit = async (newUnit: MotorUnit) => {
    const clean = sanitizeUnit(newUnit);
    const updated = [clean, ...units];
    setUnits(updated);
    saveUnits(updated);
    try {
      await addUnitToFirestore(clean);
    } catch (e) {
      console.error('Gagal menyimpan unit ke database:', e);
    }
  };

  // Handle Edit Unit
  const handleUpdateUnit = async (updatedUnit: MotorUnit) => {
    const clean = sanitizeUnit(updatedUnit);
    const updated = units.map((u) => (u.id === clean.id ? clean : u));
    setUnits(updated);
    saveUnits(updated);
    try {
      await updateUnitInFirestore(clean);
    } catch (e) {
      console.error('Gagal memperbarui unit di database:', e);
    }
  };

  // Handle Update Payments
  const handleUpdatePayments = async (unitId: string, payments: PaymentEntry[]) => {
    let updatedItem: MotorUnit | null = null;
    const updated = units.map((u) => {
      if (u.id === unitId) {
        updatedItem = {
          ...u,
          pemasukan_detail: payments,
          updated_at: new Date().toISOString(),
        };
        return updatedItem;
      }
      return u;
    });
    setUnits(updated);
    saveUnits(updated);
    if (updatedItem) {
      try {
        await updateUnitInFirestore(updatedItem);
      } catch (e) {
        console.error('Gagal menyimpan pembayaran ke database:', e);
      }
    }
  };

  // Handle Mark Lunas
  const handleConfirmLunas = async (unitId: string) => {
    const nowIso = new Date().toISOString();
    let updatedItem: MotorUnit | null = null;
    const updated = units.map((u) => {
      if (u.id === unitId) {
        updatedItem = {
          ...u,
          status: 'Lunas' as const,
          tanggal_lunas: nowIso,
          updated_at: nowIso,
        };
        return updatedItem;
      }
      return u;
    });
    setUnits(updated);
    saveUnits(updated);
    if (updatedItem) {
      try {
        await updateUnitInFirestore(updatedItem);
      } catch (e) {
        console.error('Gagal memperbarui status lunas di database:', e);
      }
    }
  };

  // Handle Delete Unit Permanently
  const handleDeleteUnit = async (unitId: string) => {
    markUnitDeletedLocally(unitId);
    const updated = units.filter((u) => u.id !== unitId);
    setUnits(updated);
    saveUnits(updated);
    try {
      await deleteUnitFromFirestore(unitId);
    } catch (e) {
      console.error('Gagal menghapus unit dari database:', e);
    }
  };

  const totalActiveUnits = computedUnits.filter((u) => !u.is_expired_lunas).length;
  const countH2 = computedUnits.filter((u) => !u.is_expired_lunas && u.status !== 'Lunas' && u.kategori_tempo === 'H-2').length;
  const totalDueAlerts = countH2;

  // Notifikasi bel dan pengingat: HANYA mengingatkan untuk unit yang H-2 sesuai tanggal masuk
  const soundPlayedRef = useRef(false);
  useEffect(() => {
    if (!soundPlayedRef.current && soundEnabled && countH2 > 0) {
      soundPlayedRef.current = true;
      const timer = setTimeout(() => {
        playLuxuryChime();
        triggerDeviceNotification(
          'Motorku - Pengingat Jatuh Tempo (H-2)',
          `Terdapat ${countH2} unit motor yang akan jatuh tempo 2 hari lagi (H-2) sesuai tanggal masuk yang terdaftar.`
        );
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [soundEnabled, countH2]);

  return (
    <div className="min-h-screen flex flex-col text-slate-100">
      {/* Luxury Top Bar Header with live cloud sync badge and audio controls */}
      <Header
        onOpenAddModal={() => {
          setPreselectedPenggadai(null);
          setIsAddOpen(true);
        }}
        onOpenPenggadaiModal={() => setIsPenggadaiModalOpen(true)}
        totalPenggadai={penggadaiList.length}
        totalActiveUnits={totalActiveUnits}
        totalDueAlerts={totalDueAlerts}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        syncStatus={syncStatus}
        isRefreshing={isRefreshing}
        onRefresh={handleForceRefresh}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Financial & Operational Summary Cards */}
        <SummaryCards
          units={computedUnits}
          selectedPemilikDana={selectedPemilikDana}
          onSelectPemilikDana={(pemilik) => setSelectedPemilikDana(pemilik)}
          onFilterLelang={() => setStatusFilter('Lelang')}
        />

        {/* Shortcut Bar for H-2 to H-0 Due Dates with Audio Alert */}
        <TempoShortcutBar
          units={computedUnits}
          activeTempoFilter={tempoFilter}
          onSelectTempoFilter={(filter) => setTempoFilter(filter)}
        />

        {/* Unit Data Table */}
        <UnitTable
          units={computedUnits}
          statusFilter={statusFilter}
          onChangeStatusFilter={(status) => setStatusFilter(status)}
          tempoFilter={tempoFilter}
          selectedPemilikDana={selectedPemilikDana}
          onChangePemilikDana={(pemilik) => setSelectedPemilikDana(pemilik)}
          onOpenReceipt={(unit) => setReceiptUnit(unit)}
          onOpenPayments={(unit) => setPaymentUnit(unit)}
          onOpenEdit={(unit) => setEditingUnit(unit)}
          onOpenLunasConfirm={(unit) => setLunasUnit(unit)}
          onDeleteUnit={handleDeleteUnit}
          onRequestDelete={(unit) => setDeleteTargetUnit(unit)}
        />
      </main>

      {/* Luxury Footer */}
      <footer className="mt-auto py-6 border-t border-slate-900 bg-[#080c14]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          <p className="font-mono-numbers">
            &copy; {new Date().getFullYear()} <span className="gold-gradient-text font-bold">MOTORKU</span> &mdash; Sistem Manajemen Penitipan, Parkir &amp; Pembiayaan Gadai Motor.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AddUnitModal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setPreselectedPenggadai(null);
        }}
        onAddUnit={handleAddUnit}
        existingCount={units.length}
        penggadaiList={penggadaiList}
        preselectedPenggadai={preselectedPenggadai}
      />

      <EditUnitModal
        isOpen={!!editingUnit}
        unit={editingUnit}
        onClose={() => setEditingUnit(null)}
        onUpdateUnit={handleUpdateUnit}
        penggadaiList={penggadaiList}
      />

      <PaymentModal
        isOpen={!!activePaymentUnit}
        unit={activePaymentUnit}
        onClose={() => setPaymentUnit(null)}
        onUpdatePayments={handleUpdatePayments}
      />

      <ReceiptModal
        isOpen={!!activeReceiptUnit}
        unit={activeReceiptUnit}
        onClose={() => setReceiptUnit(null)}
      />

      <ConfirmLunasModal
        isOpen={!!lunasUnit}
        unit={lunasUnit}
        onClose={() => setLunasUnit(null)}
        onConfirmLunas={handleConfirmLunas}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTargetUnit}
        unit={deleteTargetUnit}
        onClose={() => setDeleteTargetUnit(null)}
        onConfirmDelete={handleDeleteUnit}
      />

      <PenggadaiModal
        isOpen={isPenggadaiModalOpen}
        onClose={() => setIsPenggadaiModalOpen(false)}
        penggadaiList={penggadaiList}
        units={computedUnits}
        onSelectForNewPawn={(p) => {
          setPreselectedPenggadai(p);
          setIsAddOpen(true);
        }}
        onSavePenggadai={async (p) => {
          await upsertPenggadaiToFirestore(p);
        }}
        onDeletePenggadai={async (penggadaiId) => {
          await deletePenggadaiFromFirestore(penggadaiId);
          deletePenggadaiLocal(penggadaiId);
          setPenggadaiList((prev) => prev.filter((p) => p.id !== penggadaiId));
        }}
      />
    </div>
  );
}
