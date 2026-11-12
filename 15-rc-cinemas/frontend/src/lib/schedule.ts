import { addDays, format, isToday, isTomorrow, startOfDay } from "date-fns";

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Backend convention (matches Python's date.weekday()): Monday=0 .. Sunday=6.
 * JS Date#getDay() is Sunday=0, so this remaps it. */
export function toBackendWeekday(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function toDateStr(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function dayLabel(d: Date): string {
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE d MMM");
}

export interface DayCell {
  dateStr: string;
  label: string;
  date: Date;
}

export function buildDayWindow(count: number): DayCell[] {
  const start = startOfDay(new Date());
  return Array.from({ length: count }, (_, i) => {
    const date = addDays(start, i);
    return { dateStr: toDateStr(date), label: dayLabel(date), date };
  });
}

/** Mirrors the backend's bulk-create date resolution, for a live "N shows" preview. */
export function countOccurrences(startDateStr: string, endDateStr: string, days: Set<number>): number {
  if (!startDateStr || !endDateStr || days.size === 0) return 0;
  let cursor = new Date(`${startDateStr}T00:00:00`);
  const end = new Date(`${endDateStr}T00:00:00`);
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime()) || end < cursor) return 0;

  let count = 0;
  while (cursor <= end) {
    if (days.has(toBackendWeekday(cursor))) count += 1;
    cursor = addDays(cursor, 1);
  }
  return count;
}
