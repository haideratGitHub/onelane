import { describe, it, expect } from "vitest";
import {
  newSession,
  elapsedMs,
  elapsedMinutes,
  isRunning,
  isPaused,
  pause,
  resume,
  complete,
  abandon,
  addCheckin,
  hasOverrun,
} from "../session";

const MIN = 60 * 1000;
const T0 = 1_700_000_000_000; // fixed base epoch (no Date.now in pure logic)

function make() {
  return newSession({
    id: "s1",
    domainId: "trading",
    weekId: "2026-W24",
    intendedOutcome: "  Review 3 setups  ",
    plannedDurationMin: 50,
    now: T0,
  });
}

describe("newSession", () => {
  it("starts running with one open segment and a trimmed outcome", () => {
    const s = make();
    expect(s.status).toBe("active");
    expect(s.intendedOutcome).toBe("Review 3 setups");
    expect(s.segments).toEqual([{ start: T0, end: null }]);
    expect(isRunning(s)).toBe(true);
    expect(isPaused(s)).toBe(false);
  });
});

describe("elapsed (timestamp-based)", () => {
  it("counts an open segment up to now — survives backgrounding", () => {
    const s = make();
    // App was backgrounded; we only know wall-clock now. No interval ran.
    expect(elapsedMs(s, T0 + 25 * MIN)).toBe(25 * MIN);
    expect(elapsedMinutes(s, T0 + 25 * MIN)).toBe(25);
  });

  it("freezes while paused and resumes accumulating", () => {
    let s = make();
    s = pause(s, T0 + 20 * MIN);
    expect(isPaused(s)).toBe(true);
    // Time passes while paused — elapsed must NOT grow.
    expect(elapsedMs(s, T0 + 35 * MIN)).toBe(20 * MIN);
    s = resume(s, T0 + 35 * MIN);
    expect(isRunning(s)).toBe(true);
    // 20 min before pause + 10 min after resume.
    expect(elapsedMs(s, T0 + 45 * MIN)).toBe(30 * MIN);
  });

  it("pause/resume are no-ops in the wrong state", () => {
    let s = make();
    expect(resume(s, T0 + MIN)).toBe(s); // already running
    s = pause(s, T0 + 10 * MIN);
    expect(pause(s, T0 + 12 * MIN)).toBe(s); // already paused
  });
});

describe("finishing a block", () => {
  it("complete closes the segment, stamps endAt and the closure note", () => {
    let s = make();
    s = complete(s, T0 + 50 * MIN, "  Logged 3 setups  ");
    expect(s.status).toBe("completed");
    expect(s.endAt).toBe(T0 + 50 * MIN);
    expect(s.closureNote).toBe("Logged 3 setups");
    expect(isRunning(s)).toBe(false);
    expect(elapsedMs(s, T0 + 90 * MIN)).toBe(50 * MIN); // frozen after completion
  });

  it("complete from a paused state keeps the paused duration", () => {
    let s = make();
    s = pause(s, T0 + 20 * MIN);
    s = complete(s, T0 + 40 * MIN, "done");
    expect(elapsedMs(s, T0 + 99 * MIN)).toBe(20 * MIN);
  });

  it("abandon marks the block left without a forced note", () => {
    let s = make();
    s = abandon(s, T0 + 5 * MIN);
    expect(s.status).toBe("abandoned");
    expect(s.closureNote).toBeNull();
    expect(elapsedMs(s, T0 + 99 * MIN)).toBe(5 * MIN);
  });
});

describe("check-ins and yak-shave guard", () => {
  it("records a check-in with a default null response", () => {
    let s = make();
    s = addCheckin(s, { at: T0 + 15 * MIN, prompt: "Still on Trading?" });
    expect(s.checkins).toHaveLength(1);
    expect(s.checkins[0]?.response).toBeNull();
  });

  it("hasOverrun trips only past the planned length", () => {
    const s = make(); // planned 50 min
    expect(hasOverrun(s, T0 + 49 * MIN)).toBe(false);
    expect(hasOverrun(s, T0 + 51 * MIN)).toBe(true);
  });
});
