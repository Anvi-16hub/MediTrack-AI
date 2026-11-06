import { supabase } from '../lib/supabase';

function throwIfError(result) {
  if (result.error) throw result.error;
  return result.data;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '');
}

function fromMedicineRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    condition: row.condition || '',
    prescribedBy: row.prescribed_by || '',
    schedule: row.schedule || [],
    reminderTimes: row.reminder_times || [],
    dosage: row.dosage || '',
    instructions: row.instructions || '',
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    color: row.color || '#0ea5e9',
  };
}

function fromDoseRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    medicineId: row.medicine_id,
    medicineName: row.medicine_name || '',
    date: row.dose_date,
    time: row.taken_at ? new Date(row.taken_at).toTimeString().slice(0, 5) : null,
    scheduledTime: row.scheduled_time,
    slot: row.slot,
    status: row.status,
  };
}

function fromCaregiverRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.caregiver_name || '',
    relationship: row.caregiver_relationship || '',
    email: row.caregiver_email || '',
    phone: row.caregiver_phone || '',
    accessLevel: row.can_manage_medicines || row.can_log_doses ? 'Full Access' : 'View Only',
    consentGiven: Boolean(row.patient_consent_at),
    consentDate: row.patient_consent_at ? row.patient_consent_at.slice(0, 10) : '',
    accepted: Boolean(row.caregiver_accepted_at),
    status: row.status,
  };
}

export async function loadSupabaseAppData(authUser) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const [profileResult, medicineResult, doseResult, caregiverResult] = await Promise.all([
    supabase.from('profiles').select('full_name,email').eq('id', authUser.id).maybeSingle(),
    supabase.from('medicines').select('*').order('created_at', { ascending: true }),
    supabase.from('dose_records').select('*').order('dose_date', { ascending: false }),
    supabase.from('caregiver_access').select('*').eq('patient_id', authUser.id).is('revoked_at', null).order('created_at', { ascending: false }).limit(1),
  ]);
  const profile = throwIfError(profileResult);
  const medicineRows = throwIfError(medicineResult) || [];
  const doseRows = throwIfError(doseResult) || [];
  const caregiverRows = throwIfError(caregiverResult) || [];
  const medicines = medicineRows.map(fromMedicineRow);
  const medicineNames = new Map(medicines.map((medicine) => [medicine.id, medicine.name]));

  return {
    profile: {
      name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email || 'MediTrack user',
      email: profile?.email || authUser.email || '',
    },
    medicines,
    doseRecords: doseRows.map((row) => ({
      ...fromDoseRow(row),
      medicineName: row.medicine_name || medicineNames.get(row.medicine_id) || 'Medicine removed',
    })),
    caregiver: fromCaregiverRow(caregiverRows[0]),
  };
}

export async function upsertSupabaseMedicine(medicine, authUserId) {
  if (!supabase) throw new Error('Supabase is not configured.');
  let ownerId = medicine.userId || authUserId;
  if (!medicine.userId) {
    const caregiverResult = await supabase.from('caregiver_access')
      .select('patient_id')
      .eq('caregiver_id', authUserId)
      .eq('status', 'active')
      .is('revoked_at', null)
      .eq('can_manage_medicines', true)
      .limit(2);
    const grants = throwIfError(caregiverResult) || [];
    if (grants.length > 1) throw new Error('This account can manage multiple patients. Select one patient before adding a medicine.');
    if (grants[0]) ownerId = grants[0].patient_id;
  }
  const row = {
    user_id: ownerId,
    name: medicine.name,
    condition: medicine.condition || '',
    prescribed_by: medicine.prescribedBy || '',
    dosage: medicine.dosage || '',
    instructions: medicine.instructions || '',
    schedule: medicine.schedule || [],
    reminder_times: medicine.reminderTimes || [],
    start_date: medicine.startDate || null,
    end_date: medicine.endDate || null,
    color: medicine.color || '#0ea5e9',
  };
  if (isUuid(medicine.id)) row.id = medicine.id;
  throwIfError(await supabase.from('medicines').upsert(row).select('id').single());
}

export async function deleteSupabaseMedicine(medicineId) {
  if (!supabase) throw new Error('Supabase is not configured.');
  throwIfError(await supabase.from('medicines').delete().eq('id', medicineId));
}

export async function upsertSupabaseDose(record, medicineOwnerId) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const takenAt = record.status === 'taken'
    ? new Date(`${record.date}T${record.time || '12:00'}:00`).toISOString()
    : null;
  const row = {
    user_id: record.userId || medicineOwnerId,
    medicine_id: record.medicineId,
    medicine_name: record.medicineName || '',
    dose_date: record.date,
    taken_at: takenAt,
    scheduled_time: record.scheduledTime,
    slot: record.slot,
    status: record.status,
  };
  throwIfError(await supabase.from('dose_records').upsert(row, { onConflict: 'medicine_id,dose_date,slot' }));
}

export async function saveSupabaseCaregiver(caregiver) {
  if (!supabase) throw new Error('Supabase is not configured.');
  if (!caregiver.email?.trim()) throw new Error('Enter the email of an existing MediTrack account.');
  if (!caregiver.id && !caregiver.consentGiven) throw new Error('Patient consent is required before inviting a caregiver.');

  if (caregiver.id) {
    const fullAccess = caregiver.accessLevel === 'Full Access';
    const update = caregiver.consentGiven
      ? {
          caregiver_name: caregiver.name || '',
          caregiver_email: caregiver.email.toLowerCase(),
          caregiver_relationship: caregiver.relationship || '',
          caregiver_phone: caregiver.phone || '',
          can_view: true,
          can_manage_medicines: fullAccess,
          can_log_doses: fullAccess,
          patient_consent_at: caregiver.consentDate ? new Date(caregiver.consentDate).toISOString() : new Date().toISOString(),
        }
      : { status: 'revoked', revoked_at: new Date().toISOString() };
    throwIfError(await supabase.from('caregiver_access').update(update).eq('id', caregiver.id));
    return;
  }

  const fullAccess = caregiver.accessLevel === 'Full Access';
  throwIfError(await supabase.rpc('invite_caregiver_by_email', {
    p_email: caregiver.email.trim().toLowerCase(),
    p_caregiver_name: caregiver.name || '',
    p_can_view: true,
    p_can_manage_medicines: fullAccess,
    p_can_log_doses: fullAccess,
    p_patient_consent: Boolean(caregiver.consentGiven),
    p_caregiver_relationship: caregiver.relationship || '',
    p_caregiver_phone: caregiver.phone || '',
  }));
}
