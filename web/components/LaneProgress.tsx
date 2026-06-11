"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  Rocket,
  TrendingUp,
  GraduationCap,
  Dumbbell,
  Check,
  type LucideIcon,
} from "lucide-react";

/**
 * The "weekly track record" — each domain is a lane, focused time is distance
 * travelled. The bars animate up to their value the first time they scroll into
 * view. This is the visual teaser for onelane's reward mechanic.
 */
const LANES: { name: string; color: string; Icon: LucideIcon; pct: number }[] = [
  { name: "Office", color: "#3B82F6", Icon: Briefcase, pct: 92 },
  { name: "SaaS", color: "#8B5CF6", Icon: Rocket, pct: 78 },
  { name: "Trading", color: "#10B981", Icon: TrendingUp, pct: 70 },
  { name: "Learning", color: "#F59E0B", Icon: GraduationCap, pct: 64 },
  { name: "Gym", color: "#EF4444", Icon: Dumbbell, pct: 83 },
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function LaneProgress() {
  return (
    <div className="rounded-2xl border border-white/10 bg-asphalt p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm font-medium text-fog">This week</p>
        <p className="text-sm text-fog">
          target met = <span className="text-line">70%+</span>
        </p>
      </div>
      <div className="space-y-4">
        {LANES.map((lane, i) => {
          const win = lane.pct >= 70;
          return (
            <div key={lane.name} className="flex items-center gap-3">
              <lane.Icon size={18} color={lane.color} className="shrink-0" />
              <span className="w-20 text-sm text-white/90">{lane.name}</span>
              <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-slate">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: lane.color, opacity: win ? 1 : 0.55 }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${lane.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: EASE, delay: 0.15 * i }}
                />
              </div>
              <span
                className="flex w-10 items-center justify-end gap-1 text-sm tabular-nums"
                style={{ color: win ? lane.color : "#9AA7B6" }}
              >
                {win ? <Check size={16} /> : `${lane.pct}%`}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-5 text-sm text-fog">
        Four of five lanes hit their target. Progress, not perfection.
      </p>
    </div>
  );
}
