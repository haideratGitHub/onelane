import {
  Shuffle,
  GitBranch,
  BatteryLow,
  Target,
  Inbox,
  CircleCheck,
  Check,
  type LucideIcon,
} from "lucide-react";
import { LaneProgress } from "@/components/LaneProgress";
import { StoreButtons } from "@/components/StoreButtons";
import {
  TodayPhone,
  FocusPhone,
  ReviewPhone,
  LockScreenPhone,
} from "@/components/PhoneMockups";
import { Reveal, Stagger, StaggerItem, Float } from "@/components/motion";
import { FAQS } from "@/lib/faq";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <Header />
      <Hero />
      <Problem />
      <Wedge />
      <LockScreenCapture />
      <HowItWorks />
      <Showcase />
      <Audience />
      <Reward />
      <Philosophy />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-6 w-6 items-center justify-center rounded-md bg-line">
        <span className="h-3 w-[3px] rounded-full bg-ink" />
      </span>
      <span className="text-lg font-semibold tracking-tight">onelane</span>
    </div>
  );
}

function Header() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <Logo />
      <a
        href="#download"
        className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-line/60 hover:text-line"
      >
        Get the app
      </a>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-20 pt-12 sm:pt-20">
      {/* soft glow behind the hero */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-line/10 blur-[120px]" />
      <div className="relative grid items-center gap-14 lg:grid-cols-2">
        <Stagger>
          <StaggerItem>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate px-3 py-1 text-xs font-medium text-fog">
              <span className="h-1.5 w-1.5 animate-lane-pulse rounded-full bg-line" />
              Focus · capture · closure
            </p>
          </StaggerItem>
          <StaggerItem>
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Stay in <span className="text-line">one lane</span>.
            </h1>
          </StaggerItem>
          <StaggerItem>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-fog">
              onelane protects single-tasking, captures distractions without acting
              on them, and turns your weekly plan into visible, sustainable
              progress. A mirror and a guardrail — not a taskmaster.
            </p>
          </StaggerItem>
          <StaggerItem>
            <div id="download" className="mt-8 scroll-mt-24">
              <StoreButtons />
              <p className="mt-3 text-sm text-fog">
                For builders running a job and serious side pursuits. iOS &amp;
                Android.
              </p>
            </div>
          </StaggerItem>
        </Stagger>

        <Reveal delay={0.2}>
          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-line/5 blur-2xl" />
            <Float className="relative">
              <LaneProgress />
            </Float>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Problem() {
  const cards: { Icon: LucideIcon; t: string; d: string }[] = [
    {
      Icon: Shuffle,
      t: "Task-switching",
      d: "Categories bleed into each other. No block is truly protected.",
    },
    {
      Icon: GitBranch,
      t: "Yak-shaving",
      d: "One task needs another needs another. The original goal vanishes.",
    },
    {
      Icon: BatteryLow,
      t: "No closure",
      d: "The week ends scattered, exhausting, and with nothing to show.",
    },
  ];
  return (
    <Section className="border-y border-white/5 bg-asphalt/50">
      <Reveal>
        <SectionLabel>The problem</SectionLabel>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
          You worked hard all week — and still feel like nothing got done.
        </h2>
        <p className="mt-5 max-w-2xl text-lg text-fog">
          You sit down to do one thing. An impulse for another hits. You chase it,
          abandon it, start a third. You set out to do X, which needs Y, which needs
          Z — and an hour later you&apos;re deep in Z, having forgotten X. Nothing
          gets its own protected time, and there&apos;s no record of what you
          actually finished.
        </p>
      </Reveal>
      <Stagger className="mt-10 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <StaggerItem key={c.t}>
            <div className="h-full rounded-2xl border border-white/10 bg-slate p-5">
              <c.Icon size={22} className="text-line" />
              <p className="mt-3 font-semibold text-white">{c.t}</p>
              <p className="mt-2 text-sm text-fog">{c.d}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}

function Wedge() {
  const cards: { n: string; Icon: LucideIcon; t: string; d: string }[] = [
    {
      n: "01",
      Icon: Target,
      t: "Single-tasking",
      d: "Commit to one lane for a block and stay there. Your one intended outcome stays pinned the whole time.",
    },
    {
      n: "02",
      Icon: Inbox,
      t: "Distraction capture",
      d: "A 5-second parking lot for off-task impulses. Honored without being obeyed — so you don't context-switch to chase them.",
    },
    {
      n: "03",
      Icon: CircleCheck,
      t: "Closure",
      d: "End every block knowing what got done. Scattered effort becomes a clear, visible record of progress.",
    },
  ];
  return (
    <Section>
      <Reveal>
        <SectionLabel>What makes it different</SectionLabel>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
          Not another time tracker.
        </h2>
        <p className="mt-5 max-w-2xl text-lg text-fog">
          Trackers measure where time went. onelane solves the part that actually
          hurts — drift. Three things, working together:
        </p>
      </Reveal>
      <Stagger className="mt-10 grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <StaggerItem key={c.n}>
            <div className="h-full rounded-2xl border border-white/10 bg-asphalt p-6">
              <div className="flex items-center justify-between">
                <c.Icon size={24} className="text-line" />
                <span className="text-sm font-semibold text-fog">{c.n}</span>
              </div>
              <p className="mt-4 text-xl font-semibold">{c.t}</p>
              <p className="mt-2 text-sm leading-relaxed text-fog">{c.d}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}

function LockScreenCapture() {
  const points: [string, string][] = [
    ["Your phone stays locked", "The thought is captured in seconds — the screen never even opens."],
    ["You never leave the lane", "No app-switch, no rabbit hole. The block keeps running, focus unbroken."],
    ["Triage on your terms", "Everything you park waits in the parking lot for when the block is done."],
  ];
  return (
    <Section className="border-y border-white/5 bg-asphalt/50">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <SectionLabel>New · capture without breaking focus</SectionLabel>
          <h2 className="max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">
            Park a thought without unlocking your phone.
          </h2>
          <p className="mt-5 max-w-xl text-lg text-fog">
            Mid-block, something pulls at you — a reply you owe, an idea you can&apos;t
            lose. Long-press onelane&apos;s notification right on the lock screen, type
            it, and it drops straight into your parking lot. No unlock, no app, no
            leaving your lane.
          </p>
          <ul className="mt-7 space-y-3.5">
            {points.map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <Check size={18} className="mt-0.5 flex-none text-line" />
                <span className="text-fog">
                  <span className="font-semibold text-white">{t}.</span> {d}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.15}>
          <Float className="flex justify-center">
            <LockScreenPhone width={272} />
          </Float>
        </Reveal>
      </div>
    </Section>
  );
}

function Showcase() {
  const shots: { Phone: (p: { width?: number }) => React.ReactNode; t: string; d: string }[] = [
    {
      Phone: TodayPhone,
      t: "Today",
      d: "Start a block or park a thought — this week's lanes at a glance.",
    },
    {
      Phone: FocusPhone,
      t: "In the lane",
      d: "One outcome pinned, a timer that survives a locked or closed phone.",
    },
    {
      Phone: ReviewPhone,
      t: "Weekly review",
      d: "Planned vs. actual per lane. Hitting 70% counts as a win.",
    },
  ];
  return (
    <Section>
      <Reveal>
        <SectionLabel>A look inside</SectionLabel>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
          Built to get out of your way.
        </h2>
        <p className="mt-5 max-w-2xl text-lg text-fog">
          Every screen does one job, fast. Here&apos;s the rough shape of the app.
        </p>
      </Reveal>
      <Stagger className="mt-14 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
        {shots.map(({ Phone, t, d }) => (
          <StaggerItem
            key={t}
            className="flex flex-col items-center text-center"
          >
            <Phone width={228} />
            <p className="mt-6 font-semibold text-white">{t}</p>
            <p className="mt-1 max-w-[15rem] text-sm text-fog">{d}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}

function HowItWorks() {
  const steps = [
    {
      t: "Plan the week",
      d: "Set each life domain a flexible hour budget — not rigid clock blocks that break on contact with real life.",
    },
    {
      t: "Enter a lane",
      d: "Pick a domain, state the one outcome you're after, start the timer. That outcome stays on screen.",
    },
    {
      t: "Park distractions",
      d: "An off-task thought hits? Capture it in a tap and keep going. Triage the parking lot later.",
    },
    {
      t: "Close the block",
      d: "One line: what got done. A check-in nudge asks, calmly — never nagging.",
    },
    {
      t: "See your week",
      d: "Planned vs. actual per lane, a simple trend, and a couple of honest reflection prompts.",
    },
  ];
  return (
    <Section className="border-y border-white/5 bg-asphalt/50">
      <Reveal>
        <SectionLabel>How it works</SectionLabel>
        <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
          The loop: focus → capture → closure → review.
        </h2>
      </Reveal>
      <Stagger className="mt-10 space-y-4">
        {steps.map((s, i) => (
          <StaggerItem key={s.t}>
            <div className="flex gap-5 rounded-2xl border border-white/10 bg-slate p-5">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-line font-bold text-ink">
                {i + 1}
              </span>
              <div>
                <p className="text-lg font-semibold">{s.t}</p>
                <p className="mt-1 text-fog">{s.d}</p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}

function Audience() {
  return (
    <Section>
      <Reveal>
        <SectionLabel>Who it&apos;s for</SectionLabel>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
          Operators and builders running more than one serious thing.
        </h2>
        <p className="mt-5 max-w-2xl text-lg text-fog">
          A full-time job alongside trading, a SaaS, deliberate learning — ambitious,
          self-directed, motivated, but losing energy and momentum to context-switching
          and a lack of visible progress. You won&apos;t tolerate heavy manual logging,
          so onelane keeps every action under five seconds.
        </p>
      </Reveal>
    </Section>
  );
}

function Reward() {
  return (
    <Section className="border-y border-white/5 bg-asphalt/50">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <SectionLabel>The reward</SectionLabel>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Each lane its own identity. Each week, one record worth keeping.
          </h2>
          <p className="mt-5 text-lg text-fog">
            Every domain is a lane with its own color, and focused time is distance
            travelled. At week&apos;s end the lanes complete into one track record —
            the thing you don&apos;t want to leave half-finished. Consistency is
            rewarded; a single miss never resets you to zero.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <LaneProgress />
        </Reveal>
      </div>
    </Section>
  );
}

function Philosophy() {
  const principles = [
    ["Sustainable over maximal", "70% of an ambitious plan is a win, not a failure."],
    ["Low friction", "Any logging action takes under five seconds — or it won't happen."],
    ["Progress over perfection", "No all-or-nothing. One miss never punishes you into quitting."],
    ["Calm, not nagging", "Fewer, smarter prompts. Your attention is respected."],
    ["Honesty by design", "A gentle mirror. Self-report, not surveillance."],
    ["The tool serves the behavior", "It helps you do the work — it isn't the work."],
  ];
  return (
    <Section>
      <Reveal>
        <SectionLabel>Principles</SectionLabel>
        <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
          Designed to protect you, not to perfect you.
        </h2>
      </Reveal>
      <Stagger className="mt-10 grid gap-4 sm:grid-cols-2">
        {principles.map(([t, d]) => (
          <StaggerItem key={t}>
            <div className="flex h-full gap-4 rounded-2xl border border-white/10 bg-slate p-5">
              <Check size={18} className="mt-0.5 flex-none text-line" />
              <div>
                <p className="font-semibold">{t}</p>
                <p className="mt-1 text-sm text-fog">{d}</p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}

function Faq() {
  return (
    <Section className="border-y border-white/5 bg-asphalt/50">
      <Reveal>
        <SectionLabel>FAQ</SectionLabel>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
          Questions, answered.
        </h2>
        <p className="mt-5 max-w-2xl text-lg text-fog">
          What onelane is, the problem it solves, and how it&apos;s different.
        </p>
      </Reveal>
      {/* Plain, always-visible Q&A (no collapse) so both readers and AI answer
          engines get the full text. Mirrors lib/faq.ts, which also feeds the
          FAQPage JSON-LD. */}
      <Stagger className="mt-10 grid gap-4 md:grid-cols-2">
        {FAQS.map((f) => (
          <StaggerItem key={f.q}>
            <div className="h-full rounded-2xl border border-white/10 bg-slate p-6">
              <h3 className="text-lg font-semibold text-white">{f.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fog">{f.a}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}

function FinalCta() {
  return (
    <Section className="border-t border-white/5">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-line/20 bg-asphalt p-10 text-center sm:p-16">
          <div className="lane-markings pointer-events-none absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 opacity-20" />
          <h2 className="relative text-3xl font-semibold sm:text-4xl">
            Protect your real priorities.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-fog">
            See exactly what you did. Make visible progress. End the week without
            being wrecked.
          </p>
          <div className="relative mt-8 flex justify-center">
            <StoreButtons />
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
        <Logo />
        <nav className="flex items-center gap-5 text-sm text-fog">
          <a href="/privacy" className="transition hover:text-line">
            Privacy
          </a>
          <a href="/support" className="transition hover:text-line">
            Support
          </a>
          <span>Honesty by design. © 2026 onelane.</span>
        </nav>
      </div>
    </footer>
  );
}

/* ---------- layout primitives ---------- */

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">{children}</div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-line">
      {children}
    </p>
  );
}
