import { SAMPLE_MEDICINES, SAMPLE_DOSE_RECORDS, SAMPLE_CAREGIVER } from '../data/sampleData';

const KEYS = {
  medicines: 'meditrack_medicines',
  doseRecords: 'meditrack_dose_records',
  caregiver: 'meditrack_caregiver',
  initialized: 'meditrack_initialized',
};

// Initialize localStorage with sample data on first load
export function initializeStorage() {
  if (!localStorage.getItem(KEYS.initialized)) {
    localStorage.setItem(KEYS.medicines, JSON.stringify(SAMPLE_MEDICINES));
    localStorage.setItem(KEYS.doseRecords, JSON.stringify(SAMPLE_DOSE_RECORDS));
    localStorage.setItem(KEYS.caregiver, JSON.stringify(SAMPLE_CAREGIVER));
    localStorage.setItem(KEYS.initialized, 'true');
  }
}

// --- Medicines ---
export function getMedicines() {
  return JSON.parse(localStorage.getItem(KEYS.medicines) || '[]');
}

export function saveMedicine(medicine) {
  const medicines = getMedicines();
  const idx = medicines.findIndex(m => m.id === medicine.id);
  if (idx >= 0) {
    medicines[idx] = medicine;
  } else {
    medicines.push(medicine);
  }
  localStorage.setItem(KEYS.medicines, JSON.stringify(medicines));
}

export function deleteMedicine(id) {
  const medicines = getMedicines().filter(m => m.id !== id);
  localStorage.setItem(KEYS.medicines, JSON.stringify(medicines));
}

// --- Dose Records ---
export function getDoseRecords() {
  return JSON.parse(localStorage.getItem(KEYS.doseRecords) || '[]');
}

export function saveDoseRecord(record) {
  const records = getDoseRecords();
  const idx = records.findIndex(r => r.id === record.id);
  if (idx >= 0) {
    records[idx] = record;
  } else {
    records.push(record);
  }
  localStorage.setItem(KEYS.doseRecords, JSON.stringify(records));
}

export function deleteDoseRecord(id) {
  const records = getDoseRecords().filter(r => r.id !== id);
  localStorage.setItem(KEYS.doseRecords, JSON.stringify(records));
}

// --- Caregiver ---
export function getCaregiver() {
  return JSON.parse(localStorage.getItem(KEYS.caregiver) || 'null');
}

export function saveCaregiver(caregiver) {
  localStorage.setItem(KEYS.caregiver, JSON.stringify(caregiver));
}

// --- Reset to sample data ---
export function resetToSampleData() {
  localStorage.setItem(KEYS.medicines, JSON.stringify(SAMPLE_MEDICINES));
  localStorage.setItem(KEYS.doseRecords, JSON.stringify(SAMPLE_DOSE_RECORDS));
  localStorage.setItem(KEYS.caregiver, JSON.stringify(SAMPLE_CAREGIVER));
}

