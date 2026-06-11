import { useEffect } from "react";
import { create } from "zustand";
import {
  DEFAULT_SETTINGS,
  getWeekId,
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
  createSession,
  newSessionId,
  observeDomains,
  observeOpenParking,
  observeSessionsForWeek,
  observeActiveSession,
  observeWeek,
  updateParkingItem,
  addParkingItem,
  updateSession,
  updateDomain,
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
  domains: Domain[];
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

  // actions
  domainById: (id: string) => Domain | undefined;
  ensureWeek: () => Promise<void>;
  setDomainTarget: (id: string, hours: number) => Promise<void>;
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
  week: null,
  weekSessions: [],
  activeSession: null,
  parking: [],
  activeNudgeIds: [],

  _hydrate: (uid, weekId) => set({ uid, weekId }),
  _setDomains: (domains) => set({ domains }),
  _setWeek: (week) => set({ week }),
  _setWeekSessions: (weekSessions) => set({ weekSessions }),
  _setActiveSession: (activeSession) => set({ activeSession }),
  _setParking: (parking) => set({ parking }),

  domainById: (id) => get().domains.find((d) => d.id === id),

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
 * Wire all per-user Firestore listeners into the store. Mount once inside the
 * authenticated area; re-subscribes whenever the uid changes.
 */
export function useAppSync(uid: string | null): void {
  const store = useApp;
  useEffect(() => {
    if (!uid) return;
    const weekId = getWeekId(new Date(), useApp.getState().settings.weekStartsOn);
    store.getState()._hydrate(uid, weekId);

    const unsubs = [
      observeDomains(uid, (d) => store.getState()._setDomains(d)),
      observeWeek(uid, weekId, (w) => {
        store.getState()._setWeek(w);
        if (!w) void store.getState().ensureWeek();
      }),
      observeSessionsForWeek(uid, weekId, (s) =>
        store.getState()._setWeekSessions(s),
      ),
      observeActiveSession(uid, (s) => store.getState()._setActiveSession(s)),
      observeOpenParking(uid, (p) => store.getState()._setParking(p)),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid, store]);
}
