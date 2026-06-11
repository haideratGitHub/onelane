import type { Domain, UserSettings } from "./types";

/**
 * Progress over perfection. A domain "wins" the week at 70% of its target — an
 * ambitious plan met 70% is a success, not a failure. Encoded once, here.
 */
export const WIN_THRESHOLD = 0.7;

/** Default soft length of a focus block, used to schedule the block-edge nudge. */
export const DEFAULT_BLOCK_MINUTES = 50;

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
 * Starter lanes for a new user, drawn from the brief. Each lane has its own color
 * so progress is legible per area. Editable, addable, archivable.
 */
export const DEFAULT_DOMAINS: Omit<Domain, "id">[] = [
  { name: "Office", color: "#3B82F6", icon: "💼", weeklyTargetHours: 40, order: 0, archived: false },
  { name: "Trading", color: "#10B981", icon: "📈", weeklyTargetHours: 12, order: 1, archived: false },
  { name: "SaaS", color: "#8B5CF6", icon: "🚀", weeklyTargetHours: 15, order: 2, archived: false },
  { name: "Learning", color: "#F59E0B", icon: "📚", weeklyTargetHours: 8, order: 3, archived: false },
  { name: "Gym", color: "#EF4444", icon: "🏋️", weeklyTargetHours: 6, order: 4, archived: false },
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
