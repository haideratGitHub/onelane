import { describe, it, expect } from "vitest";
import {
  getWeekStart,
  getWeekId,
  weekIdToStart,
  getWeekRange,
  isInWeek,
} from "../week";

describe("getWeekStart", () => {
  it("returns the Monday for a mid-week date (default Monday start)", () => {
    // 2026-06-10 is a Wednesday → week starts Monday 2026-06-08.
    const start = getWeekStart(new Date(2026, 5, 10));
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(5);
    expect(start.getDate()).toBe(8);
    expect(start.getDay()).toBe(1); // Monday
    expect(start.getHours()).toBe(0);
  });

  it("respects a Sunday week start", () => {
    const start = getWeekStart(new Date(2026, 5, 10), 0);
    expect(start.getDay()).toBe(0); // Sunday
    expect(start.getDate()).toBe(7);
  });

  it("is idempotent on the week-start day itself", () => {
    const monday = new Date(2026, 5, 8);
    expect(getWeekStart(monday).getTime()).toBe(getWeekStart(monday).getTime());
    expect(getWeekStart(getWeekStart(monday)).getDate()).toBe(8);
  });
});

describe("getWeekId", () => {
  it("gives the same id for every day in one week", () => {
    const ids = [8, 9, 10, 11, 12, 13, 14].map((d) =>
      getWeekId(new Date(2026, 5, d)),
    );
    expect(new Set(ids).size).toBe(1);
  });

  it("changes between consecutive weeks", () => {
    const w1 = getWeekId(new Date(2026, 5, 10));
    const w2 = getWeekId(new Date(2026, 5, 17));
    expect(w1).not.toBe(w2);
  });

  it("formats as YYYY-Www", () => {
    expect(getWeekId(new Date(2026, 5, 10))).toMatch(/^\d{4}-W\d{2}$/);
  });
});

describe("weekId round-trip", () => {
  it("weekIdToStart(getWeekId(date)) === getWeekStart(date)", () => {
    const date = new Date(2026, 5, 10, 14, 30);
    const id = getWeekId(date);
    expect(weekIdToStart(id).getTime()).toBe(getWeekStart(date).getTime());
  });

  it("range contains the originating date and is exactly 7 days", () => {
    const date = new Date(2026, 5, 10, 14, 30);
    const id = getWeekId(date);
    const { start, end } = getWeekRange(id);
    expect(date.getTime()).toBeGreaterThanOrEqual(start);
    expect(date.getTime()).toBeLessThan(end);
    expect(Math.round((end - start) / (24 * 3600 * 1000))).toBe(7);
  });

  it("throws on a malformed weekId", () => {
    expect(() => weekIdToStart("nope")).toThrow();
  });
});

describe("isInWeek", () => {
  it("includes the start, excludes the next week's start", () => {
    const id = getWeekId(new Date(2026, 5, 10));
    const { start, end } = getWeekRange(id);
    expect(isInWeek(start, id)).toBe(true);
    expect(isInWeek(end - 1, id)).toBe(true);
    expect(isInWeek(end, id)).toBe(false);
    expect(isInWeek(start - 1, id)).toBe(false);
  });
});
