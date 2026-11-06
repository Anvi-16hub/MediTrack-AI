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
import { getDateKey } from '@/utils/dates';

export interface MedicationRepository {
  getSnapshot(): AppSnapshot | Promise<AppSnapshot>;
  addMedicine(input: MedicineInput): Promise<void>;
  updateMedicine(id: string, input: MedicineInput): Promise<void>;
  deleteMedicine(id: string): Promise<void>;
  updateDoseStatus(scheduleId: string, date: string, status: DoseStatus): Promise<void>;
  updateProfile(profile: Profile): Promise<void>;
  updateNotifications(preferences: NotificationPreferences): Promise<void>;
  updateCaregiver(settings: CaregiverSettings): Promise<void>;
  acceptCaregiverInvite(accessId: string): Promise<void>;
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createInitialSnapshot(): AppSnapshot {
  const medicines = [
    { id: 'demo-med-1', name: 'Vitamin D3', dosage: '1 tablet', color: '#2376E5' },
    { id: 'demo-med-2', name: 'Demo medicine A', dosage: '1 capsule', color: '#0E9A91' },
    { id: 'demo-med-3', name: 'Demo medicine B', dosage: '5 ml', color: '#E59B32' },
  ];
  const schedules: MedicationSchedule[] = [
    { id: 'demo-schedule-1', medicineId: medicines[0].id, time: '08:00', label: 'Morning', active: true },
    { id: 'demo-schedule-2', medicineId: medicines[1].id, time: '13:00', label: 'Afternoon', active: true },
    { id: 'demo-schedule-3', medicineId: medicines[2].id, time: '20:00', label: 'Evening', active: true },
  ];
  const doseRecords: DoseRecord[] = [];
  const today = new Date();

  for (let daysAgo = 29; daysAgo >= 0; daysAgo -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);
    const dateKey = getDateKey(date);

    schedules.forEach((schedule, index) => {
      const currentDayStatuses: DoseStatus[] = ['taken', 'pending', 'missed'];
      const status = daysAgo === 0
        ? currentDayStatuses[index]
        : (daysAgo + index) % 5 === 0 ? 'missed' : 'taken';

      if (status !== 'pending') {
        doseRecords.push({
          id: `demo-dose-${dateKey}-${schedule.id}`,
          scheduleId: schedule.id,
          date: dateKey,
          status,
          takenAt: status === 'taken' ? `${dateKey}T${schedule.time}:00` : null,
        });
      }
    });
  }

  return {
    medicines,
    schedules,
    doseRecords,
    profile: { name: 'Alex Morgan', email: 'alex@example.test' },
    notifications: { remindersEnabled: true, missedDoseAlerts: true },
    caregiver: { name: '', email: '', consentGiven: false },
    pendingCaregiverInvites: [],
  };
}

class DemoMedicationRepository implements MedicationRepository {
  private snapshot = createInitialSnapshot();

  getSnapshot() {
    return {
      ...this.snapshot,
      medicines: [...this.snapshot.medicines],
      schedules: [...this.snapshot.schedules],
      doseRecords: [...this.snapshot.doseRecords],
      profile: { ...this.snapshot.profile },
      notifications: { ...this.snapshot.notifications },
      caregiver: { ...this.snapshot.caregiver },
      pendingCaregiverInvites: [...this.snapshot.pendingCaregiverInvites],
    };
  }

  async addMedicine(input: MedicineInput) {
    const medicineId = createId('medicine');
    const schedule: MedicationSchedule = {
      id: createId('schedule'),
      medicineId,
      time: input.reminderTime,
      label: this.getPeriod(input.reminderTime),
      active: true,
    };
    this.snapshot = {
      ...this.snapshot,
      medicines: [...this.snapshot.medicines, {
        id: medicineId,
        name: input.name,
        dosage: input.dosage,
        color: input.color,
      }],
      schedules: [...this.snapshot.schedules, schedule],
    };
  }

  async updateMedicine(id: string, input: MedicineInput) {
    const existingSchedule = this.snapshot.schedules.find((schedule) => schedule.medicineId === id);
    const schedule: MedicationSchedule = existingSchedule
      ? { ...existingSchedule, time: input.reminderTime, label: this.getPeriod(input.reminderTime) }
      : { id: createId('schedule'), medicineId: id, time: input.reminderTime, label: this.getPeriod(input.reminderTime), active: true };

    this.snapshot = {
      ...this.snapshot,
      medicines: this.snapshot.medicines.map((medicine) => medicine.id === id
        ? { ...medicine, name: input.name, dosage: input.dosage, color: input.color }
        : medicine),
      schedules: existingSchedule
        ? this.snapshot.schedules.map((item) => item.id === schedule.id ? schedule : item)
        : [...this.snapshot.schedules, schedule],
    };
  }

  async deleteMedicine(id: string) {
    const scheduleIds = this.snapshot.schedules
      .filter((schedule) => schedule.medicineId === id)
      .map((schedule) => schedule.id);
    this.snapshot = {
      ...this.snapshot,
      medicines: this.snapshot.medicines.filter((medicine) => medicine.id !== id),
      schedules: this.snapshot.schedules.filter((schedule) => schedule.medicineId !== id),
      doseRecords: this.snapshot.doseRecords.filter((record) => !scheduleIds.includes(record.scheduleId)),
    };
  }

  async updateDoseStatus(scheduleId: string, date: string, status: DoseStatus) {
    const existing = this.snapshot.doseRecords.find((record) => record.scheduleId === scheduleId && record.date === date);
    const record: DoseRecord = {
      id: existing?.id ?? createId('dose'),
      scheduleId,
      date,
      status,
      takenAt: status === 'taken' ? new Date().toISOString() : null,
    };
    this.snapshot = {
      ...this.snapshot,
      doseRecords: existing
        ? this.snapshot.doseRecords.map((item) => item.id === existing.id ? record : item)
        : [...this.snapshot.doseRecords, record],
    };
  }

  async updateProfile(profile: Profile) {
    this.snapshot = { ...this.snapshot, profile: { ...profile } };
  }

  async updateNotifications(preferences: NotificationPreferences) {
    this.snapshot = { ...this.snapshot, notifications: { ...preferences } };
  }

  async updateCaregiver(settings: CaregiverSettings) {
    this.snapshot = { ...this.snapshot, caregiver: { ...settings } };
  }

  async acceptCaregiverInvite() {}

  private getPeriod(time: string) {
    const hour = Number(time.slice(0, 2));
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    if (hour < 20) return 'Evening';
    return 'Night';
  }
}

// Replace this implementation with a Supabase adapter after project setup. Ownership must come from the authenticated user on the server, not from client input.
export const medicationRepository: MedicationRepository = new DemoMedicationRepository();
