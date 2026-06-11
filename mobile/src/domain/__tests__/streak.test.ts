import { describe, it, expect } from "vitest";
import {
  isWinningWeek,
  currentStreak,
  longestStreak,
  domainProgress,
} from "../streak";

describe("isWinningWeek (70% rule)", () => {
  it("wins at exactly 70%, loses below", () => {
    expect(isWinningWeek(7, 10)).toBe(true);
    expect(isWinningWeek(6.99, 10)).toBe(false);
    expect(isWinningWeek(10, 10)).toBe(true);
  });
  it("never wins with a non-positive target", () => {
    expect(isWinningWeek(5, 0)).toBe(false);
  });
});

describe("currentStreak (anti-fragile)", () => {
  it("counts leading wins, most-recent-first", () => {
    expect(currentStreak([true, true, true, false, true])).toBe(3);
  });
  it("a single recent miss ends the current streak but history is intact", () => {
    const history = [false, true, true, true];
    expect(currentStreak(history)).toBe(0);
    expect(longestStreak([...history].reverse())).toBe(3); // progress not erased
  });
  it("is zero on empty history", () => {
    expect(currentStreak([])).toBe(0);
  });
});

describe("longestStreak", () => {
  it("finds the best run anywhere", () => {
    expect(longestStreak([true, false, true, true, true, false, true])).toBe(3);
  });
});

describe("domainProgress", () => {
  it("labels a won lane", () => {
    const p = domainProgress(8, 10);
    expect(p.isWin).toBe(true);
    expect(p.pct).toBe(80);
    expect(p.label).toBe("won");
    expect(p.toWin).toBe(0);
  });
  it("reports distance to the win line when behind", () => {
    const p = domainProgress(2, 10); // 20%
    expect(p.isWin).toBe(false);
    expect(p.label).toBe("behind");
    expect(p.toWin).toBeCloseTo(5, 5); // win line is 7h, have 2h
  });
  it("calls mid-range on-track", () => {
    expect(domainProgress(6, 10).label).toBe("on-track"); // 60%
  });
  it("handles an unplanned (zero-target) lane", () => {
    const p = domainProgress(3, 0);
    expect(p.label).toBe("unplanned");
    expect(p.isWin).toBe(false);
  });
});
