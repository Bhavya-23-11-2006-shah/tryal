/**
 * Timezone utilities enforcing Asia/Kolkata (Indian Standard Time, UTC+5:30)
 */

export function getKolkataDateString(offsetDays = 0, baseDate: Date = new Date()): string {
  // Use Intl.DateTimeFormat with Asia/Kolkata timezone
  const targetDate = new Date(baseDate.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(targetDate);
}

export function getKolkataTimeString(baseDate: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(baseDate);
}
