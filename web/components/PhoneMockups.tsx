"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  Rocket,
  TrendingUp,
  GraduationCap,
  Dumbbell,
  Signal,
  Wifi,
  BatteryMedium,
  Check,
  type LucideIcon,
} from "lucide-react";

/**
 * Pure-CSS iPhone mockups rendering miniatures of the real app screens, in the
 * site's line/asphalt theme (no image assets). Used by the landing page's
 * lock-screen USP spotlight and the "look inside" showcase. Client components
 * because a couple use framer-motion; keep them faithful to the app screens.
 */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type PhoneProps = { width?: number; glow?: boolean; className?: string };

/** The onelane logo mark (yellow square + ink bar), matching the site header. */
function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="flex flex-none items-center justify-center rounded-md bg-line"
    >
      <span
        style={{ height: size * 0.48, width: 2 }}
        className="rounded-full bg-ink"
      />
    </span>
  );
}

function StatusBar({ time = "9:41" }: { time?: string }) {
  return (
    <div className="relative z-10 flex items-center justify-between px-5 pt-3">
      <span className="text-[11px] font-semibold tabular-nums text-white">
        {time}
      </span>
      <div className="flex items-center gap-1 text-white/90">
        <Signal size={12} />
        <Wifi size={12} />
        <BatteryMedium size={15} />
      </div>
    </div>
  );
}

/** The device shell: titanium-ish frame, rounded screen, Dynamic Island. */
function PhoneFrame({
  children,
  width = 248,
  glow = false,
  className = "",
}: PhoneProps & { children: React.ReactNode }) {
  return (
    <div className={`relative ${className}`}>
      {glow && (
        <div className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-line/10 blur-2xl" />
      )}
      <div
        style={{ width }}
        className="relative mx-auto rounded-[2.6rem] border border-white/15 bg-gradient-to-b from-white/15 to-white/[0.04] p-[6px] shadow-2xl"
      >
        <div className="relative aspect-[9/19.5] overflow-hidden rounded-[2.2rem] bg-ink">
          {/* Dynamic Island */}
          <div className="absolute left-1/2 top-[10px] z-20 h-[22px] w-[76px] -translate-x-1/2 rounded-full bg-black" />
          {children}
        </div>
      </div>
    </div>
  );
}

type Lane = { Icon: LucideIcon; name: string; color: string; pct: number };

function MiniLane({ Icon, name, color, pct }: Lane) {
  const win = pct >= 70;
  return (
    <div className="flex items-center gap-2">
      <Icon size={11} color={color} className="shrink-0" />
      <span className="w-12 truncate text-[9px] text-white/90">{name}</span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color, opacity: win ? 1 : 0.55 }}
        />
      </div>
      <span className="flex w-6 justify-end" style={{ color: win ? color : "#9AA7B6" }}>
        {win ? <Check size={11} /> : <span className="text-[8px] tabular-nums">{pct}%</span>}
      </span>
    </div>
  );
}

/* ------------------------------ Today ------------------------------ */

const TODAY_LANES: Lane[] = [
  { Icon: Briefcase, name: "Office", color: "#3B82F6", pct: 45 },
  { Icon: Rocket, name: "SaaS", color: "#8B5CF6", pct: 80 },
  { Icon: Dumbbell, name: "Gym", color: "#EF4444", pct: 67 },
];

export function TodayPhone(props: PhoneProps) {
  return (
    <PhoneFrame {...props}>
      <StatusBar />
      <div className="px-3.5 pt-5">
        <p className="text-[14px] font-bold text-white">Good afternoon, Haider</p>
        <p className="mt-0.5 text-[9px] text-fog">This week · Jun 8 – Jun 14</p>

        <div className="mt-3 rounded-2xl border border-white/10 bg-asphalt p-3">
          <p className="text-[7px] font-semibold uppercase tracking-wider text-line">
            Single-task
          </p>
          <p className="mt-1 text-[11px] font-semibold text-white">
            Pick one lane and stay in it.
          </p>
          <div className="mt-2.5 rounded-lg bg-line py-2 text-center text-[10px] font-bold text-ink">
            Start a focus session
          </div>
        </div>

        <div className="mt-2 rounded-xl border border-white/15 py-2 text-center text-[10px] font-semibold text-white">
          ＋ Park a thought
        </div>

        <p className="mt-4 text-[7px] font-semibold uppercase tracking-wider text-line">
          {"This week's lanes"}
        </p>
        <div className="mt-1.5 space-y-2.5 rounded-2xl border border-white/10 bg-asphalt p-3">
          {TODAY_LANES.map((l) => (
            <MiniLane key={l.name} {...l} />
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

/* --------------------------- Focus session -------------------------- */

export function FocusPhone(props: PhoneProps) {
  return (
    <PhoneFrame {...props}>
      <StatusBar />
      <div className="flex h-[calc(100%-1.75rem)] flex-col px-3.5 pt-5">
        <p className="flex items-center gap-1 text-[7px] font-semibold uppercase tracking-wider text-line">
          <Rocket size={9} /> Side project · staying in this lane
        </p>
        <div className="mt-2 rounded-2xl border border-white/10 bg-asphalt p-3">
          <p className="text-[6px] uppercase tracking-wider text-fog">The one outcome</p>
          <p className="mt-1 text-[11px] font-semibold text-white">
            Ship the onboarding screen
          </p>
        </div>

        <div className="mt-7 text-center">
          <p className="text-[34px] font-bold leading-none tabular-nums text-white">
            24m 12s
          </p>
          <p className="mt-2 text-[8px] text-fog">Focused · planned 60 min</p>
        </div>

        <div className="mt-auto space-y-1.5 pb-5">
          <div className="rounded-xl border border-white/15 py-2 text-center text-[10px] font-semibold text-white">
            Pause
          </div>
          <div className="rounded-xl border border-white/15 py-2 text-center text-[10px] font-semibold text-white">
            ＋ Park a thought
          </div>
          <div className="rounded-xl bg-line py-2 text-center text-[10px] font-bold text-ink">
            End block
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/* --------------------------- Weekly review -------------------------- */

const REVIEW_LANES: Lane[] = [
  { Icon: Briefcase, name: "Office", color: "#3B82F6", pct: 90 },
  { Icon: TrendingUp, name: "Trading", color: "#10B981", pct: 72 },
  { Icon: Rocket, name: "SaaS", color: "#8B5CF6", pct: 80 },
  { Icon: GraduationCap, name: "Learning", color: "#F59E0B", pct: 64 },
  { Icon: Dumbbell, name: "Gym", color: "#EF4444", pct: 83 },
];

export function ReviewPhone(props: PhoneProps) {
  return (
    <PhoneFrame {...props}>
      <StatusBar />
      <div className="px-3.5 pt-5">
        <p className="text-[14px] font-bold text-white">Weekly review</p>
        <p className="mt-0.5 text-[9px] text-fog">Jun 8 – Jun 14</p>

        <div className="mt-3 rounded-2xl border border-white/10 bg-asphalt p-3">
          <p className="text-[20px] font-bold leading-none text-white">
            4 <span className="text-[11px] font-semibold text-fog">/ 5 lanes won</span>
          </p>
          <p className="mt-1.5 text-[8px] text-fog">
            52h focused of 81h planned. Real progress — not perfection.
          </p>
        </div>

        <p className="mt-3 text-[7px] font-semibold uppercase tracking-wider text-line">
          Planned vs. actual
        </p>
        <div className="mt-1.5 space-y-2.5 rounded-2xl border border-white/10 bg-asphalt p-3">
          {REVIEW_LANES.map((l) => (
            <MiniLane key={l.name} {...l} />
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ---------------------- Lock screen (the USP) ----------------------- */

export function LockScreenPhone(props: PhoneProps) {
  return (
    <PhoneFrame glow {...props}>
      {/* wallpaper + faint lane marking down the middle */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c1118] via-[#0e141c] to-[#0a0e13]" />
      <div className="lane-markings pointer-events-none absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 opacity-[0.06]" />

      <div className="relative flex h-[calc(100%-1.75rem)] flex-col">
        <StatusBar />

        {/* clock */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-white/70">Thursday, June 12</p>
          <p className="text-[52px] font-semibold leading-none tabular-nums text-white">
            9:41
          </p>
        </div>

        {/* the onelane notification, with its park-a-thought text action open */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.25 }}
          className="mx-2.5 mt-auto mb-4 rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <BrandMark size={16} />
            <span className="text-[10px] font-semibold text-white">onelane</span>
            <span className="ml-auto text-[8px] text-white/50">now</span>
          </div>
          <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-white">
            <Rocket size={10} className="text-line" /> In the lane: Side project
          </p>
          <p className="mt-0.5 text-[9px] leading-snug text-white/70">
            Ship the onboarding screen · planned 60 min
          </p>

          {/* expanded text-input action (what a long-press reveals) */}
          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-white/10 bg-ink/70 px-2.5 py-2">
            <span className="flex-1 text-[9px] text-white/55">
              Reply to Sarah about the deck…
            </span>
            <span className="rounded-lg bg-line px-2 py-1 text-[8px] font-bold text-ink">
              Park
            </span>
          </div>
        </motion.div>
      </div>
    </PhoneFrame>
  );
}
