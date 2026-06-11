import {
  DEFAULT_DOMAINS,
  DEFAULT_SETTINGS,
  getWeekId,
  mergeSettings,
  type Domain,
  type ParkingLotItem,
  type Session,
  type UserSettings,
  type Week,
} from "@/src/domain";
import type { AuthUser } from "./auth";

/**
 * Demo mode — an in-memory stand-in for Firebase used when no
 * EXPO_PUBLIC_FIREBASE_* env is set (see config.ts), so the app is fully
 * walkable before any backend setup. Mirrors the repository observe/write
 * semantics: observers get an immediate emit on subscribe and re-emit after
 * every write. Data lives in module memory only — it resets on reload and
 * never syncs.
 */

/* ------------------------------ demo auth ------------------------------ */

export const DEMO_USER: AuthUser = {
  uid: "demo",
  displayName: "Demo Driver",
  email: "demo@onelane.app",
  photoURL: null,
};

let currentUser: AuthUser | null = null;
const authListeners = new Set<(user: AuthUser | null) => void>();

/**
 * Sign in the local demo user, optionally overlaying a profile (e.g. the email
 * the user typed into the real onboarding form) so the app greets them by name.
 */
export function signInDemo(profile?: Partial<AuthUser>): AuthUser {
  currentUser = { ...DEMO_USER, ...(profile ?? {}) };
  authListeners.forEach((cb) => cb(currentUser));
  return currentUser;
}

export function signOutDemo(): void {
  currentUser = null;
  authListeners.forEach((cb) => cb(null));
}

export function onAuthChangedDemo(
  cb: (user: AuthUser | null) => void,
): () => void {
  authListeners.add(cb);
  cb(currentUser); // mirror Firebase: emit current state on subscribe
  return () => authListeners.delete(cb);
}

/* ----------------------------- demo stores ----------------------------- */

const domains = new Map<string, Domain>();
const weeks = new Map<string, Week>();
const sessions = new Map<string, Session>();
const parking = new Map<string, ParkingLotItem>();

const domainListeners = new Set<(domains: Domain[]) => void>();
const weekListeners = new Set<{ weekId: string; cb: (w: Week | null) => void }>();
const sessionListeners = new Set<{
  weekId: string;
  cb: (s: Session[]) => void;
}>();
const activeSessionListeners = new Set<(s: Session | null) => void>();
const parkingListeners = new Set<(items: ParkingLotItem[]) => void>();

let idCounter = 0;
export function newDemoId(prefix: string): string {
  return `demo-${prefix}-${++idCounter}`;
}

/* current snapshots, shaped exactly like the Firestore queries */

/** ALL domains, archived included — the store derives the active subset. */
function domainsSnapshot(): Domain[] {
  return [...domains.values()].sort((a, b) => a.order - b.order);
}

function sessionsSnapshot(weekId: string): Session[] {
  return [...sessions.values()].filter((s) => s.weekId === weekId);
}

function activeSessionSnapshot(): Session | null {
  return [...sessions.values()].find((s) => s.status === "active") ?? null;
}

function parkingSnapshot(): ParkingLotItem[] {
  return [...parking.values()]
    .filter((i) => i.status === "open")
    .sort((a, b) => b.createdAt - a.createdAt);
}

function notifyDomains() {
  domainListeners.forEach((cb) => cb(domainsSnapshot()));
}
function notifyWeek(weekId: string) {
  weekListeners.forEach((l) => {
    if (l.weekId === weekId) l.cb(weeks.get(weekId) ?? null);
  });
}
function notifySessions(weekId: string) {
  sessionListeners.forEach((l) => {
    if (l.weekId === weekId) l.cb(sessionsSnapshot(weekId));
  });
  activeSessionListeners.forEach((cb) => cb(activeSessionSnapshot()));
}
function notifyParking() {
  parkingListeners.forEach((cb) => cb(parkingSnapshot()));
}

/* ------------------------------ seed data ------------------------------ */

const MIN = 60_000;
const HOUR = 60 * MIN;

/**
 * Seed the demo world once (idempotent) — called via bootstrapDomains on
 * sign-in. The plain onboarding path seeds default lanes only (real first-run
 * feel); `withSamples` (the "explore with sample data" path) also seeds a few
 * finished sessions and parking items so every screen has content.
 */
export function seedDemoData(opts?: { withSamples?: boolean }): void {
  if (domains.size > 0) return;

  DEFAULT_DOMAINS.forEach((d) => {
    const id = newDemoId("d");
    domains.set(id, { id, ...d });
  });

  if (!opts?.withSamples) return;

  const now = Date.now();
  const byOrder = domainsSnapshot();
  const office = byOrder[0]!;
  const trading = byOrder[1]!;
  const saas = byOrder[2]!;

  // A few finished blocks so Today/Review have something to show. Each session's
  // weekId derives from its own startAt, like the real app would have written.
  const samples: Array<Omit<Session, "id" | "weekId">> = [
    {
      domainId: office.id,
      intendedOutcome: "Clear the sprint review notes",
      startAt: now - 5 * HOUR,
      endAt: now - 5 * HOUR + 50 * MIN,
      segments: [{ start: now - 5 * HOUR, end: now - 5 * HOUR + 50 * MIN }],
      plannedDurationMin: 50,
      status: "completed",
      closureNote: "Notes sent to the team",
      checkins: [],
    },
    {
      domainId: saas.id,
      intendedOutcome: "Ship the onboarding email",
      startAt: now - 3 * HOUR,
      endAt: now - 3 * HOUR + 40 * MIN,
      segments: [{ start: now - 3 * HOUR, end: now - 3 * HOUR + 40 * MIN }],
      plannedDurationMin: 50,
      status: "completed",
      closureNote: "Draft scheduled",
      checkins: [],
    },
    {
      domainId: trading.id,
      intendedOutcome: "Review yesterday's setups",
      startAt: now - 26 * HOUR,
      endAt: now - 26 * HOUR + 45 * MIN,
      segments: [{ start: now - 26 * HOUR, end: now - 26 * HOUR + 45 * MIN }],
      plannedDurationMin: 45,
      status: "completed",
      closureNote: null,
      checkins: [],
    },
  ];
  for (const s of samples) {
    const id = newDemoId("s");
    const weekId = getWeekId(new Date(s.startAt), DEFAULT_SETTINGS.weekStartsOn);
    sessions.set(id, { id, weekId, ...s });
  }

  const parkingSamples = ["Reply to Sarah about the deck", "Compare flight prices for July"];
  parkingSamples.forEach((text, i) => {
    const id = newDemoId("p");
    parking.set(id, {
      id,
      text,
      createdAt: now - (i + 1) * 2 * HOUR,
      originSessionId: null,
      domainId: null,
      status: "open",
    });
  });
}

/* ------------------------------ settings ------------------------------- */

let settings: UserSettings = DEFAULT_SETTINGS;
const settingsListeners = new Set<(s: UserSettings) => void>();

export function observeSettingsDemo(
  cb: (s: UserSettings) => void,
): () => void {
  settingsListeners.add(cb);
  cb(settings);
  return () => settingsListeners.delete(cb);
}

export async function updateSettingsDemo(
  patch: Partial<UserSettings>,
): Promise<void> {
  settings = mergeSettings({ ...settings, ...patch });
  settingsListeners.forEach((cb) => cb(settings));
}

/* --------------------- repository-shaped operations --------------------- */
/* Same observe/write contracts as repositories.ts; uid is ignored (one demo user). */

export function observeDomainsDemo(cb: (d: Domain[]) => void): () => void {
  domainListeners.add(cb);
  cb(domainsSnapshot());
  return () => domainListeners.delete(cb);
}

export async function createDomainDemo(data: Omit<Domain, "id">): Promise<string> {
  const id = newDemoId("d");
  domains.set(id, { id, ...data });
  notifyDomains();
  return id;
}

export async function updateDomainDemo(
  id: string,
  patch: Partial<Omit<Domain, "id">>,
): Promise<void> {
  const existing = domains.get(id);
  if (existing) {
    domains.set(id, { ...existing, ...patch });
    notifyDomains();
  }
}

export function observeWeekDemo(
  weekId: string,
  cb: (w: Week | null) => void,
): () => void {
  const entry = { weekId, cb };
  weekListeners.add(entry);
  cb(weeks.get(weekId) ?? null);
  return () => weekListeners.delete(entry);
}

export async function upsertWeekDemo(week: Week): Promise<void> {
  const existing = weeks.get(week.id);
  weeks.set(week.id, existing ? { ...existing, ...week } : week);
  notifyWeek(week.id);
}

export async function setSessionDemo(session: Session): Promise<void> {
  const existing = sessions.get(session.id);
  sessions.set(session.id, existing ? { ...existing, ...session } : session);
  notifySessions(session.weekId);
}

export function observeActiveSessionDemo(
  cb: (s: Session | null) => void,
): () => void {
  activeSessionListeners.add(cb);
  cb(activeSessionSnapshot());
  return () => activeSessionListeners.delete(cb);
}

export function observeSessionsForWeekDemo(
  weekId: string,
  cb: (s: Session[]) => void,
): () => void {
  const entry = { weekId, cb };
  sessionListeners.add(entry);
  cb(sessionsSnapshot(weekId));
  return () => sessionListeners.delete(entry);
}

export function observeOpenParkingDemo(
  cb: (items: ParkingLotItem[]) => void,
): () => void {
  parkingListeners.add(cb);
  cb(parkingSnapshot());
  return () => parkingListeners.delete(cb);
}

export async function addParkingItemDemo(
  data: Omit<ParkingLotItem, "id">,
): Promise<string> {
  const id = newDemoId("p");
  parking.set(id, { id, ...data });
  notifyParking();
  return id;
}

export async function updateParkingItemDemo(
  id: string,
  patch: Partial<Omit<ParkingLotItem, "id">>,
): Promise<void> {
  const existing = parking.get(id);
  if (existing) {
    parking.set(id, { ...existing, ...patch });
    notifyParking();
  }
}
