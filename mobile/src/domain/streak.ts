import { WIN_THRESHOLD } from "./constants";

/**
 * Anti-fragile streaks. A "win" is hitting ≥70% of a target — never 100%. The
 * streak counts consecutive winning weeks from most recent backward. A single
 * miss ends the current streak but never deletes progress or resets you to zero;
 * we deliberately avoid quit-on-one-miss mechanics.
 */

export function isWinningWeek(actualHours: number, targetHours: number): boolean {
  if (targetHours <= 0) return false;
  return actualHours / targetHours >= WIN_THRESHOLD;
}

/**
 * Current streak length given weekly win/loss flags ordered **most-recent-first**.
 * Counts leading wins.
 */
export function currentStreak(weeklyWinsRecentFirst: boolean[]): number {
  let streak = 0;
  for (const win of weeklyWinsRecentFirst) {
    if (!win) break;
    streak += 1;
  }
  return streak;
}

/** Longest run of wins anywhere in the history (order-independent length). */
export function longestStreak(weeklyWins: boolean[]): number {
  let best = 0;
  let run = 0;
  for (const win of weeklyWins) {
    run = win ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}

export interface Progress {
  ratio: number;
  pct: number;
  isWin: boolean;
  /** Distance still to go to reach the 70% win line, in the same unit as inputs. */
  toWin: number;
  label: "won" | "on-track" | "behind" | "unplanned";
}

/**
 * Per-lane progress for display. "on-track" once you're within reach of the win
 * line; "behind" when there's real ground to make up — framed as progress, not
 * failure.
 */
export function domainProgress(actual: number, target: number): Progress {
  if (target <= 0) {
    return { ratio: 0, pct: 0, isWin: false, toWin: 0, label: "unplanned" };
  }
  const ratio = actual / target;
  const winLine = target * WIN_THRESHOLD;
  const isWin = actual >= winLine;
  return {
    ratio,
    pct: Math.round(ratio * 100),
    isWin,
    toWin: Math.max(0, winLine - actual),
    label: isWin ? "won" : ratio >= 0.5 ? "on-track" : "behind",
  };
}
