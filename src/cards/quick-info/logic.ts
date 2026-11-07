/**
 * Parses a calendar `start_time` attribute ("2026-11-07 11:00:00" or ISO) as local time.
 * Returns undefined when it cannot be parsed.
 */
export function parseEventStart(value: unknown): Date | undefined {
  if (typeof value !== 'string' || value === '') return undefined;
  const date = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
