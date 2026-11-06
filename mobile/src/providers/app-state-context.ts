import { createContext } from 'react';

import type {
  AppSnapshot,
  CaregiverSettings,
  DoseStatus,
  MedicineInput,
  NotificationPreferences,
  Profile,
} from '@/data/meditrack-types';

export type AppStateValue = AppSnapshot & {
  dataLoading: boolean;
  errorMessage: string;
  refreshData: () => Promise<void>;
  addMedicine: (input: MedicineInput) => Promise<void>;
  updateMedicine: (id: string, input: MedicineInput) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  updateDoseStatus: (scheduleId: string, date: string, status: DoseStatus) => Promise<void>;
  updateProfile: (profile: Profile) => Promise<void>;
  updateNotifications: (preferences: NotificationPreferences) => Promise<void>;
  updateCaregiver: (settings: CaregiverSettings) => Promise<void>;
  acceptCaregiverInvite: (accessId: string) => Promise<void>;
  clearError: () => void;
};

export const AppStateContext = createContext<AppStateValue | null>(null);