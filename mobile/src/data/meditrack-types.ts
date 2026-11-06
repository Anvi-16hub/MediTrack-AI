export type DoseStatus = 'pending' | 'taken' | 'missed';

export type Medicine = {
  id: string;
  userId?: string;
  name: string;
  dosage: string;
  color: string;
};

export type MedicationSchedule = {
  id: string;
  medicineId: string;
  time: string;
  label: string;
  active: boolean;
};

export type DoseRecord = {
  id: string;
  scheduleId: string;
  date: string;
  status: DoseStatus;
  takenAt: string | null;
};

export type Profile = {
  name: string;
  email: string;
};

export type NotificationPreferences = {
  remindersEnabled: boolean;
  missedDoseAlerts: boolean;
  welcomeNotifications?: boolean;
  medicineUpdateNotifications?: boolean;
  caregiverUpdateNotifications?: boolean;
};

export type CaregiverSettings = {
  id?: string;
  name: string;
  relationship?: string;
  email: string;
  phone?: string;
  consentGiven: boolean;
  accepted?: boolean;
  status?: 'pending' | 'active' | 'revoked';
  accessLevel?: 'View Only' | 'Full Access';
};

export type CaregiverInvite = {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  canManageMedicines: boolean;
  canLogDoses: boolean;
};

export type AppSnapshot = {
  medicines: Medicine[];
  schedules: MedicationSchedule[];
  doseRecords: DoseRecord[];
  profile: Profile;
  notifications: NotificationPreferences;
  caregiver: CaregiverSettings;
  pendingCaregiverInvites: CaregiverInvite[];
};

export type MedicineInput = Pick<Medicine, 'name' | 'dosage' | 'color'> & {
  reminderTime: string;
};