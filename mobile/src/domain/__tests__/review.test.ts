import { describe, it, expect } from "vitest";
import { summarizeWeek, actualHoursByDomain, weekHeadline } from "../review";
import { newSession, complete } from "../session";
import type { Session } from "../types";

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const T0 = 1_700_000_000_000;

/** Build a completed session of `hours` length in a domain. */
function block(id: string, domainId: string, hours: number): Session {
  const s = newSession({
    id,
    domainId,
    weekId: "2026-W24",
    intendedOutcome: "x",
    now: T0,
  });
  return complete(s, T0 + hours * HOUR, "done");
}

describe("actualHoursByDomain", () => {
  it("sums focused hours per domain", () => {
    const sessions = [
      block("a", "trading", 2),
      block("b", "trading", 1.5),
      block("c", "saas", 3),
    ];
    const actuals = actualHoursByDomain(sessions, T0 + 99 * HOUR);
    expect(actuals.trading).toBeCloseTo(3.5, 5);
    expect(actuals.saas).toBeCloseTo(3, 5);
  });
});

describe("summarizeWeek", () => {
  const targets = { trading: 10, saas: 15, gym: 6 };

  it("computes ratio and applies the 70% win rule", () => {
    const sessions = [
      block("a", "trading", 7), // 70% exactly → win
      block("b", "saas", 9), // 60% → not a win
    ];
    const rows = summarizeWeek(targets, sessions, T0 + 99 * HOUR, [
      "trading",
      "saas",
      "gym",
    ]);

    const trading = rows.find((r) => r.domainId === "trading")!;
    const saas = rows.find((r) => r.domainId === "saas")!;
    const gym = rows.find((r) => r.domainId === "gym")!;

    expect(trading.ratio).toBeCloseTo(0.7, 5);
    expect(trading.isWin).toBe(true);
    expect(saas.ratio).toBeCloseTo(0.6, 5);
    expect(saas.isWin).toBe(false);
    expect(gym.actualHours).toBe(0);
    expect(gym.isWin).toBe(false);
  });

  it("respects the provided domain order", () => {
    const rows = summarizeWeek(targets, [], T0, ["gym", "trading", "saas"]);
    expect(rows.map((r) => r.domainId)).toEqual(["gym", "trading", "saas"]);
  });

  it("a zero-target domain never wins even with hours logged", () => {
    const rows = summarizeWeek({ trading: 0 }, [block("a", "trading", 5)], T0 + 99 * HOUR);
    expect(rows[0]?.isWin).toBe(false);
    expect(rows[0]?.ratio).toBe(0);
  });
});

describe("weekHeadline", () => {
  it("totals planned/actual and counts winning lanes", () => {
    const targets = { trading: 10, saas: 10 };
    const sessions = [block("a", "trading", 8), block("b", "saas", 5)];
    const rows = summarizeWeek(targets, sessions, T0 + 99 * HOUR);
    const head = weekHeadline(rows);
    expect(head.plannedHours).toBe(20);
    expect(head.actualHours).toBeCloseTo(13, 5);
    expect(head.lanesWon).toBe(1); // trading 80% wins, saas 50% does not
    expect(head.lanesPlanned).toBe(2);
  });
});
