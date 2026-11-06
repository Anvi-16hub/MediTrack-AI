export function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getRecentDateKeys(days: number, anchor = new Date()) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(anchor);
    date.setDate(anchor.getDate() - (days - index - 1));
    return getDateKey(date);
  });
}

export function formatLongDate(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatShortDay(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' });
}

export function formatClock(time: string) {
  const [hoursText, minutes] = time.split(':');
  const hours = Number(hoursText);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes} ${suffix}`;
}