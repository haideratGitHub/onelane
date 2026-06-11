import { describe, expect, it } from "vitest";
import { mergeSettings } from "../settings";
import { DEFAULT_SETTINGS } from "../constants";

describe("mergeSettings", () => {
  it("returns defaults for undefined / null", () => {
    expect(mergeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(mergeSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it("returns defaults for an empty object", () => {
    expect(mergeSettings({})).toEqual(DEFAULT_SETTINGS);
  });

  it("overlays partial top-level fields", () => {
    const merged = mergeSettings({ weekStartsOn: 0, checkinStyle: "off" });
    expect(merged.weekStartsOn).toBe(0);
    expect(merged.checkinStyle).toBe("off");
    expect(merged.quietHours).toEqual(DEFAULT_SETTINGS.quietHours);
    expect(merged.maxCheckinsPerDay).toBe(DEFAULT_SETTINGS.maxCheckinsPerDay);
  });

  it("deep-merges a partial quietHours", () => {
    const merged = mergeSettings({ quietHours: { start: 21 * 60 } as never });
    expect(merged.quietHours.start).toBe(21 * 60);
    expect(merged.quietHours.end).toBe(DEFAULT_SETTINGS.quietHours.end);
  });

  it("passes a full object through unchanged", () => {
    const full = {
      weekStartsOn: 0 as const,
      timezone: "Asia/Karachi",
      quietHours: { start: 23 * 60, end: 6 * 60 },
      maxCheckinsPerDay: 3,
      checkinStyle: "gentle" as const,
    };
    expect(mergeSettings(full)).toEqual(full);
  });

  it("does not mutate DEFAULT_SETTINGS", () => {
    const before = JSON.stringify(DEFAULT_SETTINGS);
    mergeSettings({ quietHours: { start: 0, end: 0 } });
    expect(JSON.stringify(DEFAULT_SETTINGS)).toBe(before);
  });
});
