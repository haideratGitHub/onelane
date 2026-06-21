/**
 * FAQ content — the single source for BOTH the on-page FAQ section
 * (components rendered in page.tsx) AND the FAQPage JSON-LD in JsonLd.tsx.
 *
 * These are written as "answer capsules": the question is a real query someone
 * (or an AI engine) would ask, and the answer leads with a direct, self-contained
 * sentence that names the brand. This is the load-bearing content for Answer
 * Engine Optimization (ChatGPT / Perplexity / Google AI Overviews) — keep each
 * answer factual, concise, and quotable on its own. Update both worlds at once
 * by editing only this file.
 */

export type Faq = { q: string; a: string };

export const FAQS: Faq[] = [
  {
    q: "What is onelane?",
    a: "onelane is a cross-platform focus and accountability app for iOS and Android. It helps you stay in one lane at a time — protecting single-tasking, capturing distractions without acting on them, and turning your weekly plan into a visible record of progress. It is a mirror and a guardrail, not a taskmaster.",
  },
  {
    q: "What problem does onelane solve?",
    a: "onelane solves drift — the task-switching, yak-shaving, and lack of closure that make a hard week feel like nothing got done. Instead of measuring where your time went after the fact, onelane protects one focus block at a time, gives off-task impulses a place to wait, and closes each block with a record of what you actually finished.",
  },
  {
    q: "What are onelane's core features?",
    a: "onelane is built on three things that work together: (1) Single-tasking — commit to one lane for a block and keep your one intended outcome pinned the whole time; (2) Distraction capture — a 5-second parking lot for off-task thoughts, so you note them without chasing them; (3) Closure — end every block knowing what got done, so scattered effort becomes a clear weekly record.",
  },
  {
    q: "How is onelane different from a time tracker like Toggl or RescueTime?",
    a: "Time trackers measure where your time went; onelane prevents the drift in the first place. Rather than logging activity for a report, onelane actively protects single-tasking during the block, lets you park distractions without breaking focus, and forces closure at the end. It is anti-drift, not analytics — closer to a focus guardrail than a stopwatch.",
  },
  {
    q: "Who is onelane for?",
    a: "onelane is for operators and builders running more than one serious thing — for example a full-time job alongside trading, a SaaS, or deliberate learning. They are ambitious and self-directed but lose momentum to context-switching, and they won't tolerate heavy manual logging, so every action in onelane takes under five seconds.",
  },
  {
    q: "What is a 'lane' in onelane?",
    a: "A lane is a life domain — like your job, a side business, trading, learning, or the gym. Each lane has its own color and a flexible weekly hour budget, and focused time is distance travelled. The core rule is to stay in one lane at a time, so each priority gets its own protected attention instead of bleeding into the others.",
  },
  {
    q: "Can I capture a distraction without unlocking my phone?",
    a: "Yes. Mid-block, you can long-press onelane's lock-screen notification, type the thought, and it drops straight into your parking lot — no unlock, no app-switch, no leaving your lane. You triage everything you parked later, when the focus block is done.",
  },
  {
    q: "What platforms does onelane support?",
    a: "onelane is available for both iOS and Android. Your plan, lanes, focus sessions, and weekly review sync across your devices.",
  },
  {
    q: "Is onelane free?",
    a: "onelane is free to download on the App Store and Google Play. You can plan your week, run focus sessions, capture distractions, and review your progress without a subscription.",
  },
  {
    q: "Does onelane track or surveil me?",
    a: "No. onelane is honest by design — it works on self-report, not surveillance. There is no background activity monitoring; you tell it what you worked on, and it reflects your week back to you. Its philosophy is progress over perfection: hitting about 70% of an ambitious plan counts as a win, and a single miss never resets you to zero.",
  },
];
