// Sample fictional data for MediTrack AI demo
// All names, dosages, and schedules are fictional and for demonstration only.

export const SAMPLE_MEDICINES = [
  {
    id: 'med-1',
    name: 'Amoxicillin 500mg',
    condition: 'Bacterial Infection',
    prescribedBy: 'Dr. Sarah Chen',
    schedule: ['Morning', 'Evening'],
    reminderTimes: ['08:00', '20:00'],
    dosage: '500mg',
    instructions: 'Take with food',
    startDate: '2026-10-20',
    endDate: '2026-11-20',
    color: '#0ea5e9',
  },
  {
    id: 'med-2',
    name: 'Metformin 850mg',
    condition: 'Type 2 Diabetes (Demo)',
    prescribedBy: 'Dr. James Patel',
    schedule: ['Morning', 'Afternoon', 'Night'],
    reminderTimes: ['07:30', '13:00', '21:00'],
    dosage: '850mg',
    instructions: 'Take with meals',
    startDate: '2026-09-01',
    endDate: '2027-03-01',
    color: '#14b8a6',
  },
  {
    id: 'med-3',
    name: 'Lisinopril 10mg',
    condition: 'Blood Pressure (Demo)',
    prescribedBy: 'Dr. Maria Rodriguez',
    schedule: ['Morning'],
    reminderTimes: ['09:00'],
    dosage: '10mg',
    instructions: 'Take on empty stomach',
    startDate: '2026-08-15',
    endDate: '2027-08-15',
    color: '#8b5cf6',
  },
  {
    id: 'med-4',
    name: 'Vitamin D3 1000 IU',
    condition: 'Vitamin Deficiency',
    prescribedBy: 'Dr. Sarah Chen',
    schedule: ['Morning'],
    reminderTimes: ['08:30'],
    dosage: '1000 IU',
    instructions: 'Take with breakfast',
    startDate: '2026-10-01',
    endDate: '2027-04-01',
    color: '#f59e0b',
  },
];

// Generate 7 days of dose history (fictional demo data)
function getDateStr(daysAgo) {
  const d = new Date('2026-11-06');
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export const SAMPLE_DOSE_RECORDS = [
  // --- 6 days ago ---
  { id: 'dr-1',  medicineId: 'med-1', medicineName: 'Amoxicillin 500mg',  date: getDateStr(6), time: '08:05', scheduledTime: '08:00', slot: 'Morning',   status: 'taken' },
  { id: 'dr-2',  medicineId: 'med-1', medicineName: 'Amoxicillin 500mg',  date: getDateStr(6), time: '20:12', scheduledTime: '20:00', slot: 'Evening',   status: 'taken' },
  { id: 'dr-3',  medicineId: 'med-2', medicineName: 'Metformin 850mg',    date: getDateStr(6), time: '07:35', scheduledTime: '07:30', slot: 'Morning',   status: 'taken' },
  { id: 'dr-4',  medicineId: 'med-2', medicineName: 'Metformin 850mg',    date: getDateStr(6), time: null,   scheduledTime: '13:00', slot: 'Afternoon', status: 'missed' },
  { id: 'dr-5',  medicineId: 'med-2', medicineName: 'Metformin 850mg',    date: getDateStr(6), time: '21:05', scheduledTime: '21:00', slot: 'Night',     status: 'taken' },
  { id: 'dr-6',  medicineId: 'med-3', medicineName: 'Lisinopril 10mg',    date: getDateStr(6), time: '09:02', scheduledTime: '09:00', slot: 'Morning',   status: 'taken' },
  { id: 'dr-7',  medicineId: 'med-4', medicineName: 'Vitamin D3 1000 IU', date: getDateStr(6), time: '08:33', scheduledTime: '08:30', slot: 'Morning',   status: 'taken' },

  // --- 5 days ago ---
  { id: 'dr-8',  medicineId: 'med-1', medicineName: 'Amoxicillin 500mg',  date: getDateStr(5), time: '08:10', scheduledTime: '08:00', slot: 'Morning',   status: 'taken' },
  { id: 'dr-9',  medicineId: 'med-1', medicineName: 'Amoxicillin 500mg',  date: getDateStr(5), time: null,   scheduledTime: '20:00', slot: 'Evening',   status: 'missed' },
  { id: 'dr-10', medicineId: 'med-2', medicineName: 'Metformin 850mg',    date: getDateStr(5), time: '07:28', scheduledTime: '07:30', slot: 'Morning',   status: 'taken' },
  { id: 'dr-11', medicineId: 'med-2', medicineName: 'Metformin 850mg',    date: getDateStr(5), time: '13:15', scheduledTime: '13:00', slot: 'Afternoon', status: 'taken' },
  { id: 'dr-12', medicineId: 'med-2', medicineName: 'Metformin 850mg',    date: getDateStr(5), time: null,   scheduledTime: '21:00', slot: 'Night',     status: 'missed' },
  { id: 'dr-13', medicineId: 'med-3', medicineName: 'Lisinopril 10mg',    date: getDateStr(5), time: '09:00', scheduledTime: '09:00', slot: 'Morning',   status: 'taken' },
  { id: 'dr-14', medicineId: 'med-4', medicineName: 'Vitamin D3 1000 IU', date: getDateStr(5), time: null,   scheduledTime: '08:30', slot: 'Morning',   status: 'missed' },

  // --- 4 days ago ---
  { id: 'dr-15', medicineId: 'med-1', medicineName: 'Amoxicillin 500mg',  date: getDateStr(4), time: '08:00', scheduledTime: '08:00', slot: 'Morning',   status: 'taken' },
  { id: 'dr-16', medicineId: 'med-1', medicineName: 'Amoxicillin 500mg',  date: getDateStr(4), time: '20:05', scheduledTime: '20:00', slot: 'Evening',   status: 'taken' },
  { id: 'dr-17', medicineId: 'med-2', medicineName: 'Metformin 850mg',    date: getDateStr(4), time: '07:45', scheduledTime: '07:30', slot: 'Morning',   status: 'taken' },
  { id: 'dr-18', medicineId: 'med-2', medicineName: 'Metformin 850mg',    date: getDateStr(4), time: '13:00', scheduledTime: '13:00', slot: 'Afternoon', status: 'taken' },
  { id: 'dr-19', medicineId: 'med-2', medicineName: 'Metformin 850mg',    date: getDateStr(4), time: '21:00', scheduledTime: '21:00', slot: 'Night',     status: 'taken' },
  { id: 'dr-20', medicineId: 'med-3', medicineName: 'Lisinopril 10mg',    date: getDateStr(4), time: '09:10', scheduledTime: '09:00', slot: 'Morning',   status: 'taken' },
  { id: 'dr-21', medicineId: 'med-4', medicineName: 'Vitamin D3 1000 IU', date: getDateStr(4), time: '08:30', scheduledTime: '08:30', slot: 'Morning',   status: 'taken' },

  // --- 3 days ago ---
  { id: 'dr-22', medicineId: 'med-1', medicineName: 'Amoxicillin 500mg',  date: getDateStr(3), time: null,   scheduledTime: '08:00', slot: 'Morning',   status: 'missed' },
  { id: 'dr-23', medicineId: 'med-1', medicineName: 'Amoxicillin 500mg',  date: getDateStr(3), time: '20:30', scheduledTime: '20:00', slot: 'Evening',   status: 'taken' },
  { id: 'dr-24', medicineId: 'med-2', medicineName: 'Metformin 850mg',    date: getDateStr(3), time: null,   scheduledTime: '07:30', slot: 'Morning',   status: 'missed' },
  { id: 'dr-25', medicineId: 'med-2', medicineName: 'Metformin 850mg',    date: getDateStr(3), time: null,   scheduledTime: '13:00', slot: 'Afternoon', status: 'missed' },
  { id: 'dr-26', medicineId: 'med-2', medicineName: 'Metformin 850mg',    date: getDateStr(3), time: '21:20', scheduledTime: '21:00', slot: 'Night',     status: 'taken' },
  { id: 'dr-27', medicineId: 'med-3', medicineName: 'Lisinopril 10mg',    date: getDateStr(3), time: '09:05', scheduledTime: '09:00', slot: 'Morning',   status: 'taken' },
  { id: 'dr-28', medicineId: 'med-4', medicineName: 'Vitamin D3 1000 IU', date: getDateStr(3), time: null,   scheduledTime: '08:30', slot: 'Morning',   status: 'missed' },

  // --- 2 days ago ---
  { id: 'dr-29', medicineId: 'med-1', medicineName: 'Amoxicillin 500mg',  date: getDateStr(2), time: '08:02', scheduledTime: '08:00', slot: 'Morning',   status: 'taken' },
  { id: 'dr-30', medicineId: 'med-1', medicineName: 'Amoxicillin 500mg',  date: getDateStr(2), time: '20:00', scheduledTime: '20:00', slot: 'Evening',   status: 'taken' },
  { id: 'dr-31', medicineId: 'med-2', medicineName: 'Metformin 850mg',    date: getDateStr(2), time: '07:30', scheduledTime: '07:30', slot: 'Morning',   status: 'taken' },
  { id: 'dr-32', medicineId: 'med-2', medicineName: 'Metformin 850mg',    date: getDateStr(2), time: '13:00', scheduledTime: '13:00', slot: 'Afternoon', status: 'taken' },
  { id: 'dr-33', medicineId: 'med-2', medicineName: 'Metformin 850mg',    date: getDateStr(2), time: null,   scheduledTime: '21:00', slot: 'Night',     status: 'missed' },
  { id: 'dr-34', medicineId: 'med-3', medicineName: 'Lisinopril 10mg',    date: getDateStr(2), time: '09:00', scheduledTime: '09:00', slot: 'Morning',   status: 'taken' },
  { id: 'dr-35', medicineId: 'med-4', medicineName: 'Vitamin D3 1000 IU', date: getDateStr(2), time: '08:35', scheduledTime: '08:30', slot: 'Morning',   status: 'taken' },

  // --- 1 day ago ---
  { id: 'dr-36', medicineId: 'med-1', medicineName: 'Amoxicillin 500mg',  date: getDateStr(1), time: '08:05', scheduledTime: '08:00', slot: 'Morning',   status: 'taken' },
  { id: 'dr-37', medicineId: 'med-1', medicineName: 'Amoxicillin 500mg',  date: getDateStr(1), time: '20:10', scheduledTime: '20:00', slot: 'Evening',   status: 'taken' },
  { id: 'dr-38', medicineId: 'med-2', medicineName: 'Metformin 850mg',    date: getDateStr(1), time: '07:32', scheduledTime: '07:30', slot: 'Morning',   status: 'taken' },
  { id: 'dr-39', medicineId: 'med-2', medicineName: 'Metformin 850mg',    date: getDateStr(1), time: null,   scheduledTime: '13:00', slot: 'Afternoon', status: 'missed' },
  { id: 'dr-40', medicineId: 'med-2', medicineName: 'Metformin 850mg',    date: getDateStr(1), time: '21:00', scheduledTime: '21:00', slot: 'Night',     status: 'taken' },
  { id: 'dr-41', medicineId: 'med-3', medicineName: 'Lisinopril 10mg',    date: getDateStr(1), time: '09:00', scheduledTime: '09:00', slot: 'Morning',   status: 'taken' },
  { id: 'dr-42', medicineId: 'med-4', medicineName: 'Vitamin D3 1000 IU', date: getDateStr(1), time: '08:30', scheduledTime: '08:30', slot: 'Morning',   status: 'taken' },
];

export const SAMPLE_CAREGIVER = {
  name: 'Emily Johnson',
  relationship: 'Daughter',
  email: 'emily.johnson@example.com',
  phone: '+1 (555) 234-5678',
  accessLevel: 'View Only',
  consentGiven: true,
  consentDate: '2026-10-15',
};

export const DEMO_DISCLAIMER = '⚠️ DEMO DATA — All names, medicines, and health data shown are fictional and for demonstration purposes only. This app does not provide medical advice.';

