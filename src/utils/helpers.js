// Utility helpers for MediTrack AI

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatTime(timeStr) {
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export function getLast30Days() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export function getDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

export function getShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Compute adherence stats from dose records for a date range
export function computeStats(doseRecords, dateRange) {
  const inRange = doseRecords.filter(r => !dateRange || dateRange.includes(r.date));
  const total = inRange.length;
  const taken = inRange.filter(r => r.status === 'taken').length;
  const missed = inRange.filter(r => r.status === 'missed').length;
  const adherence = total > 0 ? Math.round((taken / total) * 100) : 0;
  return { total, taken, missed, adherence };
}

// Build daily chart data for a date range
export function buildDailyChartData(doseRecords, days) {
  return days.map(date => {
    const recs = doseRecords.filter(r => r.date === date);
    const taken = recs.filter(r => r.status === 'taken').length;
    const missed = recs.filter(r => r.status === 'missed').length;
    return {
      date,
      label: getDayLabel(date),
      shortDate: getShortDate(date),
      taken,
      missed,
      total: taken + missed,
      adherence: (taken + missed) > 0 ? Math.round((taken / (taken + missed)) * 100) : 0,
    };
  });
}

// Find most-missed medicines
export function getMostMissedMedicines(doseRecords) {
  const missCount = {};
  doseRecords.filter(r => r.status === 'missed').forEach(r => {
    missCount[r.medicineName] = (missCount[r.medicineName] || 0) + 1;
  });
  return Object.entries(missCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

// Find most-missed time slots
export function getMostMissedSlots(doseRecords) {
  const slotCount = {};
  doseRecords.filter(r => r.status === 'missed').forEach(r => {
    slotCount[r.slot] = (slotCount[r.slot] || 0) + 1;
  });
  return Object.entries(slotCount)
    .sort((a, b) => b[1] - a[1])
    .map(([slot, count]) => ({ slot, count }));
}

export function getAdherenceColor(pct) {
  if (pct >= 85) return 'text-teal-600';
  if (pct >= 70) return 'text-yellow-600';
  return 'text-red-500';
}

export function getAdherenceBg(pct) {
  if (pct >= 85) return 'bg-teal-500';
  if (pct >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
}

