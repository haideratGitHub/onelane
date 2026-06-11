/**
 * onelane domain types.
 *
 * Design note: every timestamp is stored as **epoch milliseconds (number)**, not a
 * Firestore Timestamp or ISO string. This keeps the model portable and makes the
 * timestamp-based focus timer trivial: elapsed = now - startAt. Because JS does not
 * run while the app is backgrounded, the timer must be derived from stored
 * timestamps on every foreground — never from a setInterval counter.
 *
 * Self-report app → client time is acceptable ("honesty by design").
 */

export type Millis = number;

/** Grouping key for a plan week, e.g. "2026-W24". */
export type WeekId = string;

export type DomainId = string;
export type SessionId = string;
export type ParkingLotItemId = string;

/** 0 = Sunday … 6 = Saturday. Default week start is Monday (1). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * A life domain = a "lane". Each has its own visual identity so progress is
 * legible per area (Office, Gym, Trading, SaaS, Learning, …).
 */
export interface Domain {
  id: DomainId;
  name: string;
  color: string;
  icon: string;
  /** Weekly budget in hours — a flexible target, not a rigid clock block. */
  weeklyTargetHours: number;
  order: number;
  archived: boolean;
}

export type SessionStatus = "active" | "completed" | "abandoned";

/**
 * A span of focused time within a session. A session is one or more segments so
 * pause/resume works; it is "active" while the last segment is open (end === null).
 */
export interface Segment {
  start: Millis;
  end: Millis | null;
}

export type CheckinResponse = "yes" | "switched" | "done" | "no";

export interface Checkin {
  at: Millis;
  prompt: string;
  response: CheckinResponse | null;
}

/**
 * A focus block = staying in one lane. `intendedOutcome` is the single objective
 * the user commits to; it stays pinned on screen and anchors the yak-shave guard.
 */
export interface Session {
  id: SessionId;
  domainId: DomainId;
  weekId: WeekId;
  intendedOutcome: string;
  startAt: Millis;
  endAt: Millis | null;
  segments: Segment[];
  plannedDurationMin: number | null;
  status: SessionStatus;
  closureNote: string | null;
  checkins: Checkin[];
}

export type ParkingLotStatus = "open" | "done" | "promoted" | "dismissed";

/** A captured distraction — honored without being obeyed. */
export interface ParkingLotItem {
  id: ParkingLotItemId;
  text: string;
  createdAt: Millis;
  originSessionId: SessionId | null;
  domainId: DomainId | null;
  status: ParkingLotStatus;
}

export interface Reflection {
  prompt: string;
  answer: string;
}

/** A plan week. `targets` snapshots each domain's budget when the week is planned. */
export interface Week {
  id: WeekId;
  startsAt: Millis;
  targets: Record<DomainId, number>;
  reflections: Reflection[];
  status: "planned" | "active" | "closed";
}

export interface QuietHours {
  /** Minutes from midnight, e.g. 22:00 = 1320. */
  start: number;
  end: number;
}

export interface UserSettings {
  weekStartsOn: Weekday;
  timezone: string;
  quietHours: QuietHours;
  maxCheckinsPerDay: number;
  checkinStyle: "gentle" | "standard" | "off";
}

export interface UserProfile {
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
}

/** Computed per-domain comparison for the weekly review. */
export interface DomainWeekSummary {
  domainId: DomainId;
  targetHours: number;
  actualHours: number;
  /** actualHours / targetHours; 0 when target is 0. */
  ratio: number;
  /** True when ratio >= the win threshold (progress over perfection). */
  isWin: boolean;
}
