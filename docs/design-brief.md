# onelane — Design Brief / Prompt (logo + icons)

Paste the prompt below into Claude (or your design tool of choice) to generate the
brand assets. It encodes the product essence, the metaphor, the palette already used
in the app, and the exact deliverables. Everything after the line is the prompt.

---

You are a senior brand & product designer. Design a cohesive visual identity for a
mobile app called **onelane**. Deliver concepts and final assets that feel like one
system. Here is everything you need.

**What onelane is.** A focus & accountability companion for ambitious operators who
run a full-time job alongside serious side pursuits (trading, a startup, learning).
It protects single-tasking, lets you capture distractions without chasing them, and
turns a weekly plan into visible, sustainable progress. It is **a mirror and a
guardrail, not a taskmaster**.

**The essence (design to this, not just the feature list):**
- **Stay in one lane.** The whole product — and the name — is about committing to one
  thing at a time and not drifting. The central metaphor is a **lane**: a single
  marked lane on a road or track. Each area of life is its own colored lane; focused
  time is distance travelled in that lane.
- **Calm, not hustle.** Anti-burnout, anti-nagging. The vibe is focused, grown-up,
  reassuring — never gamified-cute, never aggressive "grind" energy.
- **Progress over perfection.** 70% of an ambitious plan is a win. The brand should
  feel encouraging and honest, never punishing.
- **Honest and minimal.** A gentle instrument. Restrained, precise, confident.

**Personality:** focused · calm · honest · modern · precise. Think the restraint of
Linear/Things and the emotional pull of Forest — but **no trees, no literal nature**.
Our metaphor is lanes / road markings / a running track, not a forest.

**Color palette (already in the product — match it):**
- Background "ink": `#0B0F14`; surfaces "asphalt" `#11161D`, "slate" `#1B2430`.
- Muted text "fog": `#9AA7B6`.
- **Primary accent "lane line" yellow: `#FACC15`** (like road lane markings / a
  pace line). This is the signature color.
- Per-lane palette: blue `#3B82F6`, green `#10B981`, violet `#8B5CF6`, amber
  `#F59E0B`, red `#EF4444`.
- The app is **dark-first**; assets must look great on the dark ink background.

**Core visual idea to explore:** a single vertical **lane marking** — a bold rounded
dash, like the dashed line down the middle of a road — as the heart of the mark. The
current placeholder is a yellow rounded square containing one short vertical bar; use
that as a starting point and elevate it. Other directions to try: one lane separating
from many (focus emerging from noise), a pace/finish line, a track lane, a
forward-moving "you are here" marker. The mark must read instantly at 24px.

**Deliverables:**
1. **App icon** — 1024×1024, no text, simple bold silhouette that survives down to
   40px and on both light and dark home screens. Provide the iOS icon and an Android
   **adaptive icon** (separate foreground + background layers, safe zone respected).
2. **Logo / wordmark** — the "onelane" lockup (all-lowercase wordmark + the lane
   mark). Provide: horizontal lockup, mark-only, and stacked. Give full-color,
   all-white (for dark), and all-ink (for light) variants. Specify the typeface (a
   clean geometric/grotesque sans; suggest 2–3 options).
3. **Notification / status icon** — a single-color, transparent, simplified glyph of
   the mark (Android small-icon requirements: monochrome silhouette).
4. **Splash screen** — the mark centered on `#0B0F14`.
5. **Lane / domain icon set** — five consistent line-style glyphs for the default
   lanes: Office, Trading, SaaS, Learning, Gym. Thin, geometric, 2px stroke feel, so
   they sit on colored lane chips. (The app currently uses generic line icons; these
   would be the custom, on-brand replacements.)
6. A short **usage spec**: clear space, min sizes, do/don't, and the hex tokens above.

**Constraints & guidance:**
- Dark-first; ensure contrast and legibility on `#0B0F14`.
- Yellow `#FACC15` is the hero accent — use it for the lane mark; don't drown it.
- Keep it geometric and minimal; avoid gradients-heavy, skeuomorphic, or playful-cartoon
  styles. No trees, no clocks, no checkmarks-as-logo, no generic "target" cliché.
- The silhouette should be ownable and recognizable as a single lane / pace line.
- Everything should feel like one family: the app icon, wordmark, and lane glyphs
  share the same geometry and stroke language.

Output: present 2–3 distinct logo/app-icon concepts first (with rationale tied to
"stay in one lane"), then refine the chosen direction into the full deliverable set
with the color/spacing spec.

---

## Notes for whoever runs this

- The app already ships a crude placeholder mark (a yellow rounded square with a
  vertical bar) in `web/app/page.tsx` (the `Logo` component) and the mobile sign-in
  screen — replace those once the real mark exists, and drop the icon/splash assets
  into `mobile/` (and wire them in `mobile/app.config.ts`: `icon`, `splash`,
  Android `adaptiveIcon`).
- Keep the generated palette identical to the tokens above so design and code stay in
  sync (see [architecture.md](architecture.md) §8 for where colors live).
