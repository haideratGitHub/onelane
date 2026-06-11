import { useEffect } from "react";
import { create } from "zustand";
import {
  DEFAULT_SETTINGS,
  actualHoursByDomain,
  getWeekId,
  mergeSettings,
  newSession,
  pause,
  resume,
  complete,
  abandon,
  type Domain,
  type ParkingLotItem,
  type Session,
  type UserSettings,
  type Week,
} from "@/src/domain";
import {
  createDomain,
  createSession,
  newSessionId,
  observeDomains,
  observeOpenParking,
  observeSessionsForWeek,
  observeActiveSession,
  observeUserSettings,
  observeWeek,
  updateParkingItem,
  addParkingItem,
  updateSession,
  updateDomain,
  updateUserSettings,
  upsertWeek,
} from "@/src/firebase/repositories";
import {
  scheduleSessionNudges,
  cancelNudges,
} from "@/src/notifications/notifications";

interface StartArgs {
  domainId: string;
  intendedOutcome: string;
  plannedDurationMin?: number | null;
}

interface AppState {
  uid: string | null;
  settings: UserSettings;
  weekId: string;
  /** Active (non-archived) lanes — what most screens render. */
  domains: Domain[];
  /** Every lane incl. archived — for resolving history (Review, old sessions). */
  domainsAll: Domain[];
  week: Week | null;
  weekSessions: Session[];
  activeSession: Session | null;
  parking: ParkingLotItem[];
  activeNudgeIds: string[];

  // listener setters
  _hydrate: (uid: string, weekId: string) => void;
  _setDomains: (d: Domain[]) => void;
  _setWeek: (w: Week | null) => void;
  _setWeekSessions: (s: Session[]) => void;
  _setActiveSession: (s: Session | null) => void;
  _setParking: (p: ParkingLotItem[]) => void;
  _setSettings: (s: UserSettings) => void;

  // actions
  domainById: (id: string) => Domain | undefined;
  ensureWeek: () => Promise<void>;
  setDomainTarget: (id: string, hours: number) => Promise<void>;
  addDomain: (data: {
    name: string;
    icon: string;
    color: string;
    weeklyTargetHours: number;
  }) => Promise<string | null>;
  editDomain: (
    id: string,
    patch: Partial<Pick<Domain, "name" | "icon" | "color" | "weeklyTargetHours">>,
  ) => Promise<void>;
  archiveDomain: (
    id: string,
  ) => Promise<{ ok: boolean; reason?: "active-session" }>;
  /** Hours logged against a lane this week (for archive warnings etc.). */
  loggedHoursFor: (id: string) => number;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  startSession: (args: StartArgs) => Promise<void>;
  pauseActive: () => Promise<void>;
  resumeActive: () => Promise<void>;
  completeActive: (note: string) => Promise<void>;
  abandonActive: () => Promise<void>;
  parkDistraction: (text: string) => Promise<void>;
  resolveParking: (id: string, status: ParkingLotItem["status"]) => Promise<void>;
  saveReflection: (prompt: string, answer: string) => Promise<void>;
}

export const useApp = create<AppState>((set, get) => ({
  uid: null,
  settings: DEFAULT_SETTINGS,
  weekId: getWeekId(new Date(), DEFAULT_SETTINGS.weekStartsOn),
  domains: [],
  domainsAll: [],
  week: null,
  weekSessions: [],
  activeSession: null,
  parking: [],
  activeNudgeIds: [],

  _hydrate: (uid, weekId) => set({ uid, weekId }),
  _setDomains: (domainsAll) =>
    set({ domainsAll, domains: domainsAll.filter((d) => !d.archived) }),
  _setWeek: (week) => set({ week }),
  _setWeekSessions: (weekSessions) => set({ weekSessions }),
  _setActiveSession: (activeSession) => set({ activeSession }),
  _setParking: (parking) => set({ parking }),
  _setSettings: (settings) => set({ settings }),

  // Searches ALL lanes so archived ones still resolve in history views.
  domainById: (id) => get().domainsAll.find((d) => d.id === id),

  ensureWeek: async () => {
    const { uid, weekId, week, domains, settings } = get();
    if (!uid || week || domains.length === 0) return;
    const targets: Record<string, number> = {};
    for (const d of domains) targets[d.id] = d.weeklyTargetHours;
    await upsertWeek(uid, {
      id: weekId,
      startsAt: Date.now(),
      targets,
      reflections: [],
      status: "active",
    });
  },

  setDomainTarget: async (id, hours) => {
    const { uid } = get();
    if (!uid) return;
    await updateDomain(uid, id, { weeklyTargetHours: Math.max(0, hours) });
  },

  addDomain: async (data) => {
    const { uid, domainsAll } = get();
    if (!uid) return null;
    // Max over ALL lanes (incl. archived) so a new lane can't collide with an
    // archived one's order.
    const order = domainsAll.length
      ? Math.max(...domainsAll.map((d) => d.order)) + 1
      : 0;
    return createDomain(uid, { ...data, order, archived: false });
  },

  editDomain: async (id, patch) => {
    const { uid } = get();
    if (!uid) return;
    await updateDomain(uid, id, patch);
  },

  archiveDomain: async (id) => {
    const { uid, activeSession } = get();
    if (!uid) return { ok: false };
    // Guard the single-active-session read path — the session screen resolves
    // its lane via domainById; archiving mid-block would orphan the active UI.
    if (activeSession?.domainId === id) {
      return { ok: false, reason: "active-session" as const };
    }
    await updateDomain(uid, id, { archived: true });
    return { ok: true };
  },

  loggedHoursFor: (id) => {
    const { weekSessions } = get();
    return actualHoursByDomain(weekSessions, Date.now())[id] ?? 0;
  },

  updateSettings: async (patch) => {
    const { uid, settings } = get();
    if (!uid) return;
    // Optimistic; the snapshot echo carries the same values so the week
    // listeners' weekStartsOn re-key (see useAppSync) settles in one pass.
    const next = mergeSettings({ ...settings, ...patch });
    set({ settings: next });
    await updateUserSettings(uid, next);
  },

  startSession: async ({ domainId, intendedOutcome, plannedDurationMin }) => {
    const { uid, weekId, settings, domainById } = get();
    if (!uid) return;
    const session = newSession({
      id: newSessionId(uid),
      domainId,
      weekId,
      intendedOutcome,
      plannedDurationMin: plannedDurationMin ?? null,
      now: Date.now(),
    });
    set({ activeSession: session });
    await createSession(uid, session);

    const name = domainById(domainId)?.name ?? "this lane";
    const ids = await scheduleSessionNudges(session, name, settings).catch(() => []);
    set({ activeNudgeIds: ids });
  },

  pauseActive: async () => {
    const { uid, activeSession } = get();
    if (!uid || !activeSession) return;
    const next = pause(activeSession, Date.now());
    set({ activeSession: next });
    await updateSession(uid, next);
  },

  resumeActive: async () => {
    const { uid, activeSession } = get();
    if (!uid || !activeSession) return;
    const next = resume(activeSession, Date.now());
    set({ activeSession: next });
    await updateSession(uid, next);
  },

  completeActive: async (note) => {
    const { uid, activeSession, activeNudgeIds } = get();
    if (!uid || !activeSession) return;
    const next = complete(activeSession, Date.now(), note);
    set({ activeSession: null, activeNudgeIds: [] });
    await updateSession(uid, next);
    await cancelNudges(activeNudgeIds).catch(() => {});
  },

  abandonActive: async () => {
    const { uid, activeSession, activeNudgeIds } = get();
    if (!uid || !activeSession) return;
    const next = abandon(activeSession, Date.now());
    set({ activeSession: null, activeNudgeIds: [] });
    await updateSession(uid, next);
    await cancelNudges(activeNudgeIds).catch(() => {});
  },

  parkDistraction: async (text) => {
    const { uid, activeSession } = get();
    if (!uid || !text.trim()) return;
    await addParkingItem(uid, {
      text: text.trim(),
      createdAt: Date.now(),
      originSessionId: activeSession?.id ?? null,
      domainId: activeSession?.domainId ?? null,
      status: "open",
    });
  },

  resolveParking: async (id, status) => {
    const { uid } = get();
    if (!uid) return;
    await updateParkingItem(uid, id, { status });
  },

  saveReflection: async (prompt, answer) => {
    const { uid, week } = get();
    if (!uid || !week) return;
    const reflections = [
      ...week.reflections.filter((r) => r.prompt !== prompt),
      { prompt, answer },
    ];
    await upsertWeek(uid, { ...week, reflections });
  },
}));

/**
 * Wire all per-user listeners into the store. Mount once inside the
 * authenticated area.
 *
 * Two effects on purpose:
 * - Effect 1 (uid-scoped): settings, domains, active session, parking.
 * - Effect 2 (week-scoped): re-keys on `settings.weekStartsOn` so changing the
 *   week start re-subscribes the week + sessions listeners for the new weekId.
 *
 * The weekStartsOn dependency is a PRIMITIVE selector — load-bearing: snapshot
 * emits create new `settings` objects every time, and depending on the object
 * would re-run the effect (and with the settings observer inside it, loop).
 * The primitive only changes on a real user action, so this settles in one
 * re-subscription.
 */
export function useAppSync(uid: string | null): void {
  const weekStartsOn = useApp((s) => s.settings.weekStartsOn);

  useEffect(() => {
    if (!uid) return;
    const unsubs = [
      observeUserSettings(uid, (s) => useApp.getState()._setSettings(s)),
      observeDomains(uid, (d) => useApp.getState()._setDomains(d)),
      observeActiveSession(uid, (s) => useApp.getState()._setActiveSession(s)),
      observeOpenParking(uid, (p) => useApp.getState()._setParking(p)),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const weekId = getWeekId(new Date(), weekStartsOn);
    useApp.getState()._hydrate(uid, weekId);

    const unsubs = [
      observeWeek(uid, weekId, (w) => {
        useApp.getState()._setWeek(w);
        if (!w) void useApp.getState().ensureWeek();
      }),
      observeSessionsForWeek(uid, weekId, (s) =>
        useApp.getState()._setWeekSessions(s),
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid, weekStartsOn]);
}
