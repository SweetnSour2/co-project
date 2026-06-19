import { differenceInCalendarDays, format, isToday } from "date-fns";
import type { Timestamp } from "firebase/firestore";

export function timestampToDate(value: Timestamp | Date | string): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(value);
  return value.toDate();
}

export function formatDueDate(value: Timestamp | Date | string) {
  const date = timestampToDate(value);
  if (isToday(date)) return "Today";
  return format(date, "MMM d");
}

export function daysUntil(value: Timestamp | Date | string, now = new Date()) {
  return differenceInCalendarDays(timestampToDate(value), now);
}

export function minutesToHours(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}
