import { format, isToday, isTomorrow } from "date-fns";

export function formatTime(iso: string): string {
  return format(new Date(iso), "h:mm a");
}

export function formatDate(iso: string): string {
  return format(new Date(iso), "d MMM yyyy");
}

export function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE, d MMM");
}

export function dateKey(iso: string): string {
  return format(new Date(iso), "yyyy-MM-dd");
}
