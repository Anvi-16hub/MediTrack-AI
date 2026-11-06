import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  AppSnapshot,
  CaregiverSettings,
  DoseRecord,
  DoseStatus,
  MedicationSchedule,
  MedicineInput,
  NotificationPreferences,
  Profile,
} from './meditrack-types';
import type { MedicationRepository } from './demo-medication-repository';
import { getDateKey } from '@/utils/dates';

function throwIfError(result: { error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
}

function getPeriod(time: string) {
  const hour = Number(time.slice(0, 2));
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  if (hour < 20) return 'Evening';
  return 'Night';
}

function mapMedicine(row: Record<string, any>) {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    dosage: row.dosage || '',
    color: row.color || '#0ea5e9',
  };
}

function mapSchedules(row: Record<string, any>): MedicationSchedule[] {
  const slots = (row.schedule || []) as string[];
  const times = (row.reminder_times || []) as string[];
  return slots.map((label, index) => ({
    id: `${row.id}::${label}`,
    medicineId: row.id as string,
    time: (times[index] || '00:00').slice(0, 5),
    label,
    active: true,
  }));
}

export class SupabaseMedicationRepository implements MedicationRepository {
  constructor(private readonly client: SupabaseClient, private readonly userId: string) {}

  async getSnapshot(): Promise<AppSnapshot> {
    const [profileResult, medicineResult, doseResult, preferenceResult, caregiverResult, inviteResult] = await Promise.all([
      this.client.from('profiles').select('full_name,email').eq('id', this.userId).maybeSingle(),
      this.client.from('medicines').select('*').order('created_at', { ascending: true }),
      this.client.from('dose_records').select('*').order('dose_date', { ascending: false }),
      this.client.from('notification_preferences').select('*').eq('user_id', this.userId).maybeSingle(),
      this.client.from('caregiver_access').select('*').eq('patient_id', this.userId).is('revoked_at', null).order('created_at', { ascending: false }).limit(1),
      this.client.from('caregiver_access').select('id,patient_id,patient_name,patient_email,can_manage_medicines,can_log_doses')
        .eq('caregiver_id', this.userId).eq('status', 'pending').is('revoked_at', null),
    ]);
    throwIfError(profileResult);
    throwIfError(medicineResult);
    throwIfError(doseResult);
    throwIfError(preferenceResult);
    throwIfError(caregiverResult);
    throwIfError(inviteResult);

    const medicineRows = medicineResult.data || [];
    const schedules = medicineRows.flatMap(mapSchedules);
    const doseRecords: DoseRecord[] = (doseResult.data || [])
      .filter((row) => row.status !== 'pending')
      .flatMap((row) => {
        const matchingSchedule = schedules.find((schedule) => schedule.medicineId === row.medicine_id && schedule.label === row.slot);
        if (!matchingSchedule) return [];
        return [{
          id: row.id,
          scheduleId: matchingSchedule.id,
          date: row.dose_date,
          status: row.status as DoseStatus,
          takenAt: row.taken_at,
        }];
      });
    const profile = profileResult.data;
    const preferences = preferenceResult.data;
    const caregiverRow = caregiverResult.data?.[0];

    return {
      medicines: medicineRows.map(mapMedicine),
      schedules,
      doseRecords,
      profile: {
        name: profile?.full_name || 'MediTrack user',
        email: profile?.email || '',
      },
      notifications: {
        remindersEnabled: preferences?.dose_reminder_notifications ?? true,
        missedDoseAlerts: preferences?.missed_dose_alerts ?? true,
        welcomeNotifications: preferences?.welcome_notifications ?? true,
        medicineUpdateNotifications: preferences?.medicine_update_notifications ?? true,
        caregiverUpdateNotifications: preferences?.caregiver_update_notifications ?? true,
      },
      caregiver: caregiverRow ? {
        id: caregiverRow.id,
        name: caregiverRow.caregiver_name || '',
        relationship: caregiverRow.caregiver_relationship || '',
        email: caregiverRow.caregiver_email || '',
        phone: caregiverRow.caregiver_phone || '',
        consentGiven: Boolean(caregiverRow.patient_consent_at),
        accepted: Boolean(caregiverRow.caregiver_accepted_at),
        status: caregiverRow.status,
        accessLevel: caregiverRow.can_manage_medicines || caregiverRow.can_log_doses ? 'Full Access' : 'View Only',
      } : { name: '', email: '', consentGiven: false },
      pendingCaregiverInvites: (inviteResult.data || []).map((invite) => ({
        id: invite.id,
        patientId: invite.patient_id,
        patientName: invite.patient_name || 'MediTrack patient',
        patientEmail: invite.patient_email || '',
        canManageMedicines: invite.can_manage_medicines,
        canLogDoses: invite.can_log_doses,
      })),
    };
  }

  async addMedicine(input: MedicineInput) {
    const ownerId = await this.resolveNewMedicineOwner();
    const { error } = await this.client.from('medicines').insert({
      user_id: ownerId,
      name: input.name,
      dosage: input.dosage,
      color: input.color,
      schedule: [getPeriod(input.reminderTime)],
      reminder_times: [input.reminderTime],
    });
    if (error) throw new Error(error.message);
    await this.dispatchQueuedNotifications();
  }

  async updateMedicine(id: string, input: MedicineInput) {
    const existingResult = await this.client.from('medicines').select('schedule,reminder_times').eq('id', id).single();
    throwIfError(existingResult);
    const existing = existingResult.data;
    if (!existing) throw new Error('Medicine was not found or is not accessible.');
    const schedule = (existing.schedule || []) as string[];
    const reminderTimes = (existing.reminder_times || []) as string[];
    if (schedule.length === 0) {
      schedule.push(getPeriod(input.reminderTime));
      reminderTimes.push(input.reminderTime);
    } else {
      reminderTimes[0] = input.reminderTime;
    }

    const { error } = await this.client.from('medicines').update({
      name: input.name,
      dosage: input.dosage,
      color: input.color,
      schedule,
      reminder_times: reminderTimes,
    }).eq('id', id);
    if (error) throw new Error(error.message);
    await this.dispatchQueuedNotifications();
  }

  async deleteMedicine(id: string) {
    const { error } = await this.client.from('medicines').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async updateDoseStatus(scheduleId: string, date: string, status: DoseStatus) {
    const separator = scheduleId.lastIndexOf('::');
    const medicineId = scheduleId.slice(0, separator);
    const slot = scheduleId.slice(separator + 2);
    const medicineResult = await this.client.from('medicines').select('user_id,name,schedule,reminder_times').eq('id', medicineId).single();
    throwIfError(medicineResult);
    const medicine = medicineResult.data;
    if (!medicine) throw new Error('Medicine was not found or is not accessible.');
    const schedule = (medicine.schedule || []) as string[];
    const reminderTimes = (medicine.reminder_times || []) as string[];
    const slotIndex = schedule.indexOf(slot);
    const takenAt = status === 'taken' ? new Date().toISOString() : null;
    const { error } = await this.client.from('dose_records').upsert({
      user_id: medicine.user_id,
      medicine_id: medicineId,
      medicine_name: medicine.name,
      dose_date: date || getDateKey(new Date()),
      taken_at: takenAt,
      scheduled_time: reminderTimes[slotIndex] || '00:00',
      slot,
      status,
    }, { onConflict: 'medicine_id,dose_date,slot' });
    if (error) throw new Error(error.message);
    await this.dispatchQueuedNotifications();
  }

  async updateProfile(profile: Profile) {
    const { error } = await this.client.auth.updateUser({ data: { full_name: profile.name } });
    if (error) throw new Error(error.message);
    const { error: profileError } = await this.client.from('profiles').update({ full_name: profile.name }).eq('id', this.userId);
    if (profileError) throw new Error(profileError.message);
  }

  async updateNotifications(preferences: NotificationPreferences) {
    const { error } = await this.client.from('notification_preferences').upsert({
      user_id: this.userId,
      dose_reminder_notifications: preferences.remindersEnabled,
      missed_dose_alerts: preferences.missedDoseAlerts,
      welcome_notifications: preferences.welcomeNotifications ?? true,
      medicine_update_notifications: preferences.medicineUpdateNotifications ?? true,
      caregiver_update_notifications: preferences.caregiverUpdateNotifications ?? true,
    });
    if (error) throw new Error(error.message);
  }

  async updateCaregiver(settings: CaregiverSettings) {
    const fullAccess = settings.accessLevel === 'Full Access';
    if (!settings.email.trim()) throw new Error('Enter the email of an existing MediTrack account.');
    if (settings.id) {
      const update = settings.consentGiven
        ? {
            caregiver_name: settings.name.trim(),
            caregiver_email: settings.email.trim().toLowerCase(),
            caregiver_relationship: settings.relationship || '',
            caregiver_phone: settings.phone || '',
            can_view: true,
            can_manage_medicines: fullAccess,
            can_log_doses: fullAccess,
            patient_consent_at: new Date().toISOString(),
          }
        : { status: 'revoked', revoked_at: new Date().toISOString() };
      const { error } = await this.client.from('caregiver_access').update(update).eq('id', settings.id);
      if (error) throw new Error(error.message);
      await this.dispatchQueuedNotifications();
      return;
    }
    if (!settings.consentGiven) throw new Error('Patient consent is required before inviting a caregiver.');
    const { error } = await this.client.rpc('invite_caregiver_by_email', {
      p_email: settings.email.trim().toLowerCase(),
      p_caregiver_name: settings.name.trim(),
      p_can_view: true,
      p_can_manage_medicines: fullAccess,
      p_can_log_doses: fullAccess,
      p_patient_consent: settings.consentGiven,
      p_caregiver_relationship: settings.relationship || '',
      p_caregiver_phone: settings.phone || '',
    });
    if (error) throw new Error(error.message);
    await this.dispatchQueuedNotifications();
  }

  async acceptCaregiverInvite(accessId: string) {
    const { error } = await this.client.rpc('accept_caregiver_invite', { p_access_id: accessId });
    if (error) throw new Error(error.message);
    await this.dispatchQueuedNotifications();
  }

  private async dispatchQueuedNotifications() {
    const { error } = await this.client.functions.invoke('dispatch-notifications');
    if (error) console.warn('Notification event remains queued for the server retry worker.');
  }

  private async resolveNewMedicineOwner() {
    const { data, error } = await this.client.from('caregiver_access')
      .select('patient_id')
      .eq('caregiver_id', this.userId)
      .eq('status', 'active')
      .is('revoked_at', null)
      .eq('can_manage_medicines', true)
      .limit(2);
    if (error) throw new Error(error.message);
    if ((data || []).length > 1) throw new Error('This account can manage multiple patients. Select one patient before adding a medicine.');
    return data?.[0]?.patient_id || this.userId;
  }
}
