import { useEffect, useState, type ReactNode } from 'react';

import { medicationRepository } from '@/data/demo-medication-repository';
import { SupabaseMedicationRepository } from '@/data/supabase-medication-repository';
import { AppStateContext } from '@/providers/app-state-context';
import type { CaregiverSettings, DoseStatus, MedicineInput, NotificationPreferences, Profile } from '@/data/meditrack-types';
import type { AppSnapshot } from '@/data/meditrack-types';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

const emptySnapshot: AppSnapshot = {
  medicines: [],
  schedules: [],
  doseRecords: [],
  profile: { name: '', email: '' },
  notifications: { remindersEnabled: true, missedDoseAlerts: true },
  caregiver: { name: '', email: '', consentGiven: false },
  pendingCaregiverInvites: [],
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<AppSnapshot>(emptySnapshot);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const repository = user?.mode === 'supabase' && user.id && supabase
    ? new SupabaseMedicationRepository(supabase, user.id)
    : medicationRepository;
  const dataLoading = user?.mode === 'supabase' && user.id !== loadedUserId;
  const visibleSnapshot = user?.mode === 'supabase'
    ? (user.id === loadedUserId ? snapshot : emptySnapshot)
    : medicationRepository.getSnapshot() as AppSnapshot;

  useEffect(() => {
    let active = true;
    if (user?.mode !== 'supabase' || !user.id || !supabase) return () => { active = false; };

    const userId = user.id;
    void new SupabaseMedicationRepository(supabase, userId).getSnapshot().then((nextSnapshot) => {
      if (!active) return;
      setSnapshot(nextSnapshot);
      setLoadedUserId(userId);
    }).catch((error: unknown) => {
      if (!active) return;
      setSnapshot(emptySnapshot);
      setErrorMessage(`Could not load shared data: ${error instanceof Error ? error.message : 'network error'}`);
      setLoadedUserId(userId);
    });

    return () => { active = false; };
  }, [user?.id, user?.mode]);

  useEffect(() => {
    const client = supabase;
    if (user?.mode !== 'supabase' || !user.id || !client) return undefined;
    const userId = user.id;
    const channel = client.channel(`meditrack-data-${userId}`);
    const refresh = () => {
      void new SupabaseMedicationRepository(client, userId).getSnapshot().then(setSnapshot).catch((error: unknown) => {
        setErrorMessage(`Live data refresh failed: ${error instanceof Error ? error.message : 'network error'}`);
      });
    };

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medicines' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dose_records' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'caregiver_access' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notification_preferences' }, refresh)
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setErrorMessage('Live updates are unavailable. Reload the tab to fetch the latest shared data.');
        }
      });

    return () => { void client.removeChannel(channel); };
  }, [user?.id, user?.mode]);

  async function runAction(action: () => Promise<void>) {
    try {
      await action();
      setSnapshot(await repository.getSnapshot());
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save your changes. Check your connection and try again.');
    }
  }

  async function refreshData() {
    try {
      setSnapshot(await repository.getSnapshot());
      if (user?.mode === 'supabase' && user.id) setLoadedUserId(user.id);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not refresh data. Check your connection and try again.');
    }
  }

  async function addMedicine(input: MedicineInput) {
    await runAction(() => repository.addMedicine(input));
  }

  async function updateMedicine(id: string, input: MedicineInput) {
    await runAction(() => repository.updateMedicine(id, input));
  }

  async function deleteMedicine(id: string) {
    await runAction(() => repository.deleteMedicine(id));
  }

  async function updateDoseStatus(scheduleId: string, date: string, status: DoseStatus) {
    await runAction(() => repository.updateDoseStatus(scheduleId, date, status));
  }

  async function updateProfile(profile: Profile) {
    await runAction(() => repository.updateProfile(profile));
  }

  async function updateNotifications(preferences: NotificationPreferences) {
    await runAction(() => repository.updateNotifications(preferences));
  }

  async function updateCaregiver(settings: CaregiverSettings) {
    await runAction(() => repository.updateCaregiver(settings));
  }

  async function acceptCaregiverInvite(accessId: string) {
    await runAction(() => repository.acceptCaregiverInvite(accessId));
  }

  return (
    <AppStateContext.Provider
      value={{
        ...visibleSnapshot,
        dataLoading,
        errorMessage,
        refreshData,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        updateDoseStatus,
        updateProfile,
        updateNotifications,
        updateCaregiver,
        acceptCaregiverInvite,
        clearError: () => setErrorMessage(''),
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

