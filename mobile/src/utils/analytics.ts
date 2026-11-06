import type { DoseRecord, MedicationSchedule, Medicine } from '@/data/meditrack-types';
import { formatShortDay, getRecentDateKeys } from './dates';

export type AdherenceSummary = {
  taken: number;
  missed: number;
  pending: number;
  completed: number;
  adherence: number;
};

export function summarizeDoses(records: DoseRecord[]): AdherenceSummary {
  const taken = records.filter((record) => record.status === 'taken').length;
  const missed = records.filter((record) => record.status === 'missed').length;
  const pending = records.filter((record) => record.status === 'pending').length;
  const completed = taken + missed;
  return {
    taken,
    missed,
    pending,
    completed,
    adherence: completed === 0 ? 0 : Math.round((taken / completed) * 100),
  };
}

export function buildDailyAdherence(records: DoseRecord[], days: number) {
  return getRecentDateKeys(days).map((date) => {
    const summary = summarizeDoses(records.filter((record) => record.date === date));
    return { date, label: formatShortDay(date), ...summary };
  });
}

export function getMissedPatterns(
  records: DoseRecord[],
  schedules: MedicationSchedule[],
  medicines: Medicine[],
) {
  const schedulesById = new Map(schedules.map((schedule) => [schedule.id, schedule]));
  const medicinesById = new Map(medicines.map((medicine) => [medicine.id, medicine]));
  const counts = new Map<string, number>();

  records.filter((record) => record.status === 'missed').forEach((record) => {
    const schedule = schedulesById.get(record.scheduleId);
    if (!schedule) return;
    const period = schedule.label || 'Other time';
    counts.set(period, (counts.get(period) ?? 0) + 1);
  });

  const missedByMedicine = new Map<string, number>();
  records.filter((record) => record.status === 'missed').forEach((record) => {
    const schedule = schedulesById.get(record.scheduleId);
    const medicine = schedule ? medicinesById.get(schedule.medicineId) : undefined;
    if (medicine) missedByMedicine.set(medicine.name, (missedByMedicine.get(medicine.name) ?? 0) + 1);
  });

  return {
    byPeriod: [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
    byMedicine: [...missedByMedicine.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
  };
}