/** Shared color tokens (kept in sync with tailwind.config.js). */
export const colors = {
  ink: "#0B0F14",
  asphalt: "#11161D",
  slate: "#1B2430",
  fog: "#9AA7B6",
  line: "#FACC15",
  white: "#FFFFFF",
  win: "#10B981",
  danger: "#EF4444",
} as const;

/** Fallback palette for newly created lanes, cycled by order. */
export const LANE_PALETTE = [
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#14B8A6",
  "#F97316",
] as const;

export function laneColor(order: number): string {
  return LANE_PALETTE[order % LANE_PALETTE.length] as string;
}

/** Curated icon choices for the lane editor (Domain.icon is an emoji string). */
export const LANE_ICONS = [
  "💼",
  "📈",
  "🚀",
  "📚",
  "🏋️",
  "🎨",
  "🧠",
  "🏠",
  "❤️",
  "✍️",
  "🎵",
  "🌱",
] as const;
