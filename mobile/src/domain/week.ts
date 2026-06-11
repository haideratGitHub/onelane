import type { Weekday, WeekId, Millis } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Clone a date and zero its time component (local midnight). */
function atMidnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** DST-safe day arithmetic — setDate respects local wall-clock, ms math doesn't. */
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** The local-midnight Date of the first day of the week containing `date`. */
export function getWeekStart(date: Date, weekStartsOn: Weekday = 1): Date {
  const d = atMidnight(date);
  const diff = (d.getDay() - weekStartsOn + 7) % 7;
  return addDays(d, -diff);
}

/** Whole-week index between two week-start dates (rounded; DST-tolerant). */
function weeksBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / DAY_MS / 7);
}

/**
 * Stable "YYYY-Www" key for the week containing `date`. The week number is
 * 1-based within the year of the week's first day. Two dates in the same
 * Mon–Sun (or configured) week always produce the same id; consecutive weeks
 * differ by one. Inverse of {@link weekIdToStart}.
 */
export function getWeekId(date: Date, weekStartsOn: Weekday = 1): WeekId {
  const start = getWeekStart(date, weekStartsOn);
  const year = start.getFullYear();
  const firstWeekStart = getWeekStart(new Date(year, 0, 1), weekStartsOn);
  const weekNumber = weeksBetween(start, firstWeekStart) + 1;
  return `${year}-W${String(weekNumber).padStart(2, "0")}`;
}

/** Parse a "YYYY-Www" key back to the week's local-midnight start Date. */
export function weekIdToStart(weekId: WeekId, weekStartsOn: Weekday = 1): Date {
  const match = /^(\d{4})-W(\d{1,2})$/.exec(weekId);
  if (!match) throw new Error(`Invalid weekId: ${weekId}`);
  const year = Number(match[1]);
  const weekNumber = Number(match[2]);
  const firstWeekStart = getWeekStart(new Date(year, 0, 1), weekStartsOn);
  return addDays(firstWeekStart, (weekNumber - 1) * 7);
}

/** Inclusive start / exclusive end of a week, as epoch millis. */
export function getWeekRange(
  weekId: WeekId,
  weekStartsOn: Weekday = 1,
): { start: Millis; end: Millis } {
  const start = weekIdToStart(weekId, weekStartsOn);
  const end = addDays(start, 7);
  return { start: start.getTime(), end: end.getTime() };
}

/** Human label for a week, e.g. "Jun 8 – Jun 14". */
export function formatWeekRange(
  weekId: WeekId,
  weekStartsOn: Weekday = 1,
): string {
  const start = weekIdToStart(weekId, weekStartsOn);
  const end = addDays(start, 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

/** True when `at` falls within the given week. */
export function isInWeek(
  at: Millis,
  weekId: WeekId,
  weekStartsOn: Weekday = 1,
): boolean {
  const { start, end } = getWeekRange(weekId, weekStartsOn);
  return at >= start && at < end;
}
