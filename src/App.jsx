import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MedicineManagement from './components/MedicineManagement';
import DoseTracking from './components/DoseTracking';
import Analytics from './components/Analytics';
import CaregiverSection from './components/CaregiverSection';
import Reports from './components/Reports';
import AuthPage from './components/AuthPage';
import { supabase } from './lib/supabase';
import { useMediTrackAuth } from './hooks/use-meditrack-auth';
import {
  deleteSupabaseMedicine,
  loadSupabaseAppData,
  saveSupabaseCaregiver,
  upsertSupabaseDose,
  upsertSupabaseMedicine,
} from './utils/supabase-repository';
import {
  initializeStorage,
  getMedicines, saveMedicine, deleteMedicine,
  getDoseRecords, saveDoseRecord,
  getCaregiver, saveCaregiver,
} from './utils/storage';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, ready: authReady, supabaseConfigured, signIn, signUp, continueDemo, signOut } = useMediTrackAuth();
  const [profile, setProfile] = useState({ name: 'Demo User', email: 'demo@meditrack.ai' });
  const [medicines, setMedicines] = useState([]);
  const [doseRecords, setDoseRecords] = useState([]);
  const [caregiver, setCaregiver] = useState(null);
  const [dataError, setDataError] = useState('');
  const [loadedUserId, setLoadedUserId] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadData() {
      setDataError('');
      if (user?.mode === 'supabase') {
        try {
          const data = await loadSupabaseAppData(user);
          if (!active) return;
          setProfile(data.profile);
          setMedicines(data.medicines);
          setDoseRecords(data.doseRecords);
          setCaregiver(data.caregiver);
          setLoadedUserId(user.id);
        } catch (error) {
          if (active) {
            setMedicines([]);
            setDoseRecords([]);
            setCaregiver(null);
            setDataError(`Could not load shared data: ${error.message}`);
            setLoadedUserId(user.id);
          }
        }
        return;
      }

      initializeStorage();
      if (!active) return;
      setProfile(user?.mode === 'demo'
        ? { name: user.name, email: user.email }
        : { name: 'Demo User', email: 'demo@meditrack.ai' });
      setMedicines(getMedicines());
      setDoseRecords(getDoseRecords());
      setCaregiver(getCaregiver());
    }
    void loadData();
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (user?.mode !== 'supabase' || !user.id || !supabase) return undefined;
    let active = true;
    const refresh = async () => {
      try {
        const data = await loadSupabaseAppData(user);
        if (!active) return;
        setProfile(data.profile);
        setMedicines(data.medicines);
        setDoseRecords(data.doseRecords);
        setCaregiver(data.caregiver);
      } catch (error) {
        if (active) setDataError(`Live data refresh failed: ${error.message}`);
      }
    };
    const channel = supabase.channel(`website-data-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medicines' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dose_records' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'caregiver_access' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notification_preferences' }, refresh)
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setDataError('Live updates are unavailable. Reload the page to fetch the latest shared data.');
        }
      });
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [user]);

  async function reloadSupabaseData() {
    if (user?.mode !== 'supabase') return;
    const data = await loadSupabaseAppData(user);
    setProfile(data.profile);
    setMedicines(data.medicines);
    setDoseRecords(data.doseRecords);
    setCaregiver(data.caregiver);
  }

  async function retryDataLoad() {
    try {
      await reloadSupabaseData();
      setDataError('');
    } catch (error) {
      setDataError(`Could not refresh shared data: ${error.message}`);
    }
  }

  function requestNotificationDispatch() {
    if (!supabase) return;
    void supabase.functions.invoke('dispatch-notifications').catch(() => {});
  }

  async function handleSaveMedicine(med) {
    if (user?.mode === 'supabase') {
      try {
        await upsertSupabaseMedicine(med, user.id);
        await reloadSupabaseData();
        requestNotificationDispatch();
      } catch (error) {
        setDataError(`Medicine was not saved: ${error.message}`);
      }
      return;
    }
    saveMedicine(med);
    setMedicines(getMedicines());
  }

  async function handleDeleteMedicine(id) {
    if (user?.mode === 'supabase') {
      try {
        await deleteSupabaseMedicine(id);
        await reloadSupabaseData();
      } catch (error) {
        setDataError(`Medicine was not deleted: ${error.message}`);
      }
      return;
    }
    deleteMedicine(id);
    setMedicines(getMedicines());
  }

  async function handleSaveDose(record) {
    if (user?.mode === 'supabase') {
      const medicine = medicines.find((item) => item.id === record.medicineId);
      try {
        await upsertSupabaseDose(record, medicine?.userId || user.id);
        await reloadSupabaseData();
      } catch (error) {
        setDataError(`Dose status was not saved: ${error.message}`);
      }
      return;
    }
    saveDoseRecord(record);
    setDoseRecords(getDoseRecords());
  }

  async function handleSaveCaregiver(cg) {
    if (user?.mode === 'supabase') {
      try {
        await saveSupabaseCaregiver(cg);
        await reloadSupabaseData();
        requestNotificationDispatch();
      } catch (error) {
        setDataError(`Caregiver access was not updated: ${error.message}`);
      }
      return;
    }
    saveCaregiver(cg);
    setCaregiver(cg);
  }

  async function handleLogout() {
    try {
      await signOut();
      setDataError('');
      setActivePage('dashboard');
    } catch (error) {
      setDataError(`Could not sign out: ${error.message}`);
    }
  }

  function renderPage() {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            medicines={medicines}
            doseRecords={doseRecords}
            onNavigate={setActivePage}
          />
        );
      case 'medicines':
        return (
          <MedicineManagement
            medicines={medicines}
            onSave={handleSaveMedicine}
            onDelete={handleDeleteMedicine}
          />
        );
      case 'tracking':
        return (
          <DoseTracking
            medicines={medicines}
            doseRecords={doseRecords}
            onSaveDose={handleSaveDose}
          />
        );
      case 'analytics':
        return <Analytics doseRecords={doseRecords} />;
      case 'caregiver':
        return (
          <CaregiverSection
            caregiver={caregiver}
            onSaveCaregiver={handleSaveCaregiver}
            supabaseMode={user?.mode === 'supabase'}
          />
        );
      case 'reports':
        return <Reports medicines={medicines} doseRecords={doseRecords} />;
      default:
        return null;
    }
  }

  if (!authReady) {
    return <div className="min-h-screen grid place-items-center bg-gray-50 text-sm text-gray-500">Restoring secure session…</div>;
  }

  if (!user) {
    return <AuthPage onLogin={signIn} onRegister={signUp} onDemoLogin={continueDemo} supabaseConfigured={supabaseConfigured} />;
  }

  if (user.mode === 'supabase' && user.id !== loadedUserId) {
    return <div className="min-h-screen grid place-items-center bg-gray-50 text-sm text-gray-500">Loading your shared account data…</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        user={{ ...user, ...profile }}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto lg:ml-0">
        {/* Mobile top padding for the mobile header */}
        <div className="pt-14 lg:pt-0 min-h-full">
          {dataError && (
            <div role="alert" className="mx-6 mt-4 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{dataError}</span>
              <div className="flex shrink-0 gap-3">
                <button className="font-semibold underline" onClick={() => { void retryDataLoad(); }}>Retry</button>
                <button className="font-semibold underline" onClick={() => setDataError('')}>Dismiss</button>
              </div>
            </div>
          )}
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
