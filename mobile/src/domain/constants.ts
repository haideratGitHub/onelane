import type { Domain, UserSettings } from "./types";

/**
 * Progress over perfection. A domain "wins" the week at 70% of its target — an
 * ambitious plan met 70% is a success, not a failure. Encoded once, here.
 */
export const WIN_THRESHOLD = 0.7;

/** Default soft length of a focus block, used to schedule the block-edge nudge. */
export const DEFAULT_BLOCK_MINUTES = 60;

/**
 * Above this weekly total the Plan screen nudges toward right-sizing — an
 * ambitious plan should be questioned, not executed blindly. Encoded once, here.
 */
export const MAX_REASONABLE_WEEK_HOURS = 60;

export const DEFAULT_SETTINGS: UserSettings = {
  weekStartsOn: 1, // Monday
  timezone: "UTC",
  quietHours: { start: 22 * 60, end: 7 * 60 }, // 22:00 – 07:00
  maxCheckinsPerDay: 6,
  checkinStyle: "standard",
};

/**
 * Sample lanes for DEMO MODE ONLY ("explore with sample data"). Real users —
 * and the plain demo onboarding path — start with zero lanes and build their
 * own; the lane editor offers LANE_TEMPLATES below as a starting point.
 */
export const DEFAULT_DOMAINS: Omit<Domain, "id">[] = [
  { name: "Office", color: "#3B82F6", icon: "💼", weeklyTargetHours: 40, order: 0, archived: false },
  { name: "Trading", color: "#10B981", icon: "📈", weeklyTargetHours: 12, order: 1, archived: false },
  { name: "SaaS", color: "#8B5CF6", icon: "🚀", weeklyTargetHours: 15, order: 2, archived: false },
  { name: "Learning", color: "#F59E0B", icon: "📚", weeklyTargetHours: 8, order: 3, archived: false },
  { name: "Gym", color: "#EF4444", icon: "🏋️", weeklyTargetHours: 6, order: 4, archived: false },
];

/**
 * One-tap starting points offered in the lane editor when creating a lane.
 * They only PREFILL the form (name/icon/color/target) — nothing is created
 * until the user saves, and every field stays editable, so the template row
 * never disturbs the normal creation flow. Targets are deliberately modest
 * (right-sized beats ambitious — see MAX_REASONABLE_WEEK_HOURS).
 */
export const LANE_TEMPLATES: Omit<Domain, "id" | "order" | "archived">[] = [
  { name: "Work", icon: "💼", color: "#3B82F6", weeklyTargetHours: 30 },
  { name: "Side project", icon: "🚀", color: "#8B5CF6", weeklyTargetHours: 8 },
  { name: "Learning", icon: "📚", color: "#F59E0B", weeklyTargetHours: 5 },
  { name: "Health", icon: "🏋️", color: "#EF4444", weeklyTargetHours: 4 },
  { name: "Creative", icon: "🎨", color: "#EC4899", weeklyTargetHours: 4 },
  { name: "People I love", icon: "❤️", color: "#10B981", weeklyTargetHours: 6 },
];

/** Reflection prompts surfaced at the end of the week. */
export const WEEKLY_REFLECTION_PROMPTS = [
  "What pulled you off track most this week?",
  "Which block felt best?",
  "What will you protect harder next week?",
] as const;

/** Check-in copy. Calm and specific, never nagging. */
export const CHECKIN_PROMPTS = {
  midBlock: (domain: string) => `Still on ${domain}?`,
  blockEdge: (domain: string) => `Wrap up ${domain}?`,
  endOfDayLog: (domain: string) => `Did you do your ${domain} block?`,
} as const;
