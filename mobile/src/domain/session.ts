import type {
  Checkin,
  CheckinResponse,
  Millis,
  Session,
  SessionId,
} from "./types";

const MIN_MS = 60 * 1000;

export interface NewSessionArgs {
  id: SessionId;
  domainId: string;
  weekId: string;
  intendedOutcome: string;
  plannedDurationMin?: number | null;
  now: Millis;
}

/** Create a running session with its first open segment. */
export function newSession(args: NewSessionArgs): Session {
  return {
    id: args.id,
    domainId: args.domainId,
    weekId: args.weekId,
    intendedOutcome: args.intendedOutcome.trim(),
    startAt: args.now,
    endAt: null,
    segments: [{ start: args.now, end: null }],
    plannedDurationMin: args.plannedDurationMin ?? null,
    status: "active",
    closureNote: null,
    checkins: [],
  };
}

/**
 * Focused time so far, in ms. Sums every segment; an open segment counts up to
 * `now`. This is the ONLY source of truth for the timer — derive it from stored
 * timestamps on every foreground so it survives backgrounding/termination.
 */
export function elapsedMs(session: Session, now: Millis): Millis {
  return session.segments.reduce((sum, seg) => {
    const end = seg.end ?? now;
    return sum + Math.max(0, end - seg.start);
  }, 0);
}

export function elapsedMinutes(session: Session, now: Millis): number {
  return Math.floor(elapsedMs(session, now) / MIN_MS);
}

function lastSegment(session: Session) {
  return session.segments[session.segments.length - 1];
}

/** Running = active with an open (not-yet-ended) segment. */
export function isRunning(session: Session): boolean {
  const seg = lastSegment(session);
  return session.status === "active" && !!seg && seg.end === null;
}

/** Paused = active, but the latest segment is closed. */
export function isPaused(session: Session): boolean {
  return session.status === "active" && !isRunning(session);
}

/** Close the open segment (no-op if already paused/finished). */
export function pause(session: Session, now: Millis): Session {
  if (!isRunning(session)) return session;
  const segments = session.segments.map((s, i) =>
    i === session.segments.length - 1 ? { ...s, end: now } : s,
  );
  return { ...session, segments };
}

/** Open a new segment (no-op if already running or finished). */
export function resume(session: Session, now: Millis): Session {
  if (session.status !== "active" || isRunning(session)) return session;
  return { ...session, segments: [...session.segments, { start: now, end: null }] };
}

function finalize(
  session: Session,
  now: Millis,
  status: "completed" | "abandoned",
  closureNote: string | null,
): Session {
  const paused = pause(session, now);
  return { ...paused, endAt: now, status, closureNote };
}

/** Close the block with the "what got done" note. */
export function complete(
  session: Session,
  now: Millis,
  closureNote: string,
): Session {
  return finalize(session, now, "completed", closureNote.trim() || null);
}

/** Abandon the block (left the lane). closureNote optional. */
export function abandon(
  session: Session,
  now: Millis,
  closureNote: string | null = null,
): Session {
  return finalize(session, now, "abandoned", closureNote);
}

export function addCheckin(
  session: Session,
  checkin: Omit<Checkin, "response"> & { response?: CheckinResponse | null },
): Session {
  return {
    ...session,
    checkins: [...session.checkins, { ...checkin, response: checkin.response ?? null }],
  };
}

/**
 * Yak-shave guard: true once the block has run past its planned length (or a
 * fallback) so we can gently ask "still working toward <outcome>?".
 */
export function hasOverrun(
  session: Session,
  now: Millis,
  fallbackMinutes = 50,
): boolean {
  const limit = (session.plannedDurationMin ?? fallbackMinutes) * MIN_MS;
  return elapsedMs(session, now) > limit;
}
