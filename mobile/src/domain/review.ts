import { WIN_THRESHOLD } from "./constants";
import { elapsedMs } from "./session";
import type { DomainId, DomainWeekSummary, Session } from "./types";

const HOUR_MS = 60 * 60 * 1000;

/**
 * Total focused hours per domain across the given sessions. Counts both completed
 * and abandoned blocks (the time was really spent); open segments count up to
 * `now`. Pass the sessions already filtered to the week of interest.
 */
export function actualHoursByDomain(
  sessions: Session[],
  now: number,
): Record<DomainId, number> {
  const out: Record<DomainId, number> = {};
  for (const s of sessions) {
    out[s.domainId] = (out[s.domainId] ?? 0) + elapsedMs(s, now) / HOUR_MS;
  }
  return out;
}

/**
 * Planned vs. actual per domain for the weekly review. One row per domain in
 * `targets`, ordered by `domainOrder` if provided. A domain "wins" at ≥70% of
 * target — progress over perfection.
 */
export function summarizeWeek(
  targets: Record<DomainId, number>,
  sessions: Session[],
  now: number,
  domainOrder: DomainId[] = [],
): DomainWeekSummary[] {
  const actuals = actualHoursByDomain(sessions, now);
  const domainIds = Array.from(
    new Set([...Object.keys(targets), ...Object.keys(actuals)]),
  );

  const rows = domainIds.map((domainId): DomainWeekSummary => {
    const targetHours = targets[domainId] ?? 0;
    const actualHours = actuals[domainId] ?? 0;
    const ratio = targetHours > 0 ? actualHours / targetHours : 0;
    return {
      domainId,
      targetHours,
      actualHours,
      ratio,
      isWin: targetHours > 0 && ratio >= WIN_THRESHOLD,
    };
  });

  if (domainOrder.length) {
    const rank = new Map(domainOrder.map((id, i) => [id, i]));
    rows.sort(
      (a, b) =>
        (rank.get(a.domainId) ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(b.domainId) ?? Number.MAX_SAFE_INTEGER),
    );
  }
  return rows;
}

/** Whole-week headline: total planned vs. actual hours and how many lanes won. */
export function weekHeadline(summaries: DomainWeekSummary[]): {
  plannedHours: number;
  actualHours: number;
  lanesWon: number;
  lanesPlanned: number;
} {
  const planned = summaries.filter((s) => s.targetHours > 0);
  return {
    plannedHours: planned.reduce((sum, s) => sum + s.targetHours, 0),
    actualHours: summaries.reduce((sum, s) => sum + s.actualHours, 0),
    lanesWon: summaries.filter((s) => s.isWin).length,
    lanesPlanned: planned.length,
  };
}
