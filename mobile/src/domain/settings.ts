import { DEFAULT_SETTINGS } from "./constants";
import type { UserSettings } from "./types";

/**
 * Merge a possibly-missing / partial persisted settings object over the
 * defaults. Defends every storage failure shape: user doc doesn't exist,
 * doc exists without `.settings`, partial settings, partial `quietHours`.
 * Pure — safe to unit test and reuse on any backend.
 */
export function mergeSettings(
  partial?: Partial<UserSettings> | null,
): UserSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...(partial ?? {}),
    quietHours: {
      ...DEFAULT_SETTINGS.quietHours,
      ...(partial?.quietHours ?? {}),
    },
  };
}
