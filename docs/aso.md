# App Store Optimization (ASO) — onelane

The publish-time playbook for the **Apple App Store** and **Google Play**. This is a
reference doc (not a code module): it holds the exact, copy-paste-ready store listing
metadata plus the keyword/visual/retention strategy to use when submitting onelane.

> **Web SEO/AEO lives elsewhere.** The landing page's search + AI-answer-engine
> optimization is implemented in `web/` (metadata, JSON-LD, sitemap, robots, FAQ,
> `llms.txt`) and documented in [landing-page.md](landing-page.md). This doc is
> **store** optimization only. Keep the two consistent — the same positioning
> (single-tasking · distraction capture · closure) should appear in both.

How the two stores differ (the rule that drives everything below):

| | Apple App Store | Google Play |
|---|---|---|
| What's indexed for search | **Title + Subtitle + Keyword field** (the description is **not** indexed) | **Title + Short description + Full description** are all indexed |
| Keyword input | Hidden **100-char keyword field** (comma-separated, no spaces) | **Inline** in the visible descriptions (no hidden field) |
| Write the description for… | **Conversion only** (humans) | **Conversion + ranking** (humans *and* the algorithm) |
| Don't repeat keywords | Across title/subtitle/keyword field (Apple de-dupes & combines per locale) | Stuffing hurts — aim ~2–3% density, stay readable |

2026 reality check (why this matters): per Gartner ~40% of information-seeking
queries now start in an AI interface, and both stores have shifted ranking weight from
raw installs toward **retention & engagement** (Day-1/Day-7 retention). Visual ASO
(icon + first screenshot) now usually decides the tap before text does. Apple also runs
**OCR on screenshot captions** and generates **App Store Tags** from your metadata —
so caption text is effectively indexable. Plan accordingly.

---

## 0. Keyword research (do this first)

Group keywords by intent and rank by *relevance × volume × winnability* (favor
**long-tail** in 2026 — lower competition, higher intent).

**Brand (must always rank #1 for these):**
`onelane`, `onelane app`, `one lane`, `onelane focus`

**Primary (high volume, what the app *is*):**
`focus app`, `single-tasking`, `single tasking app`, `deep work`, `deep work app`,
`productivity app`, `time blocking`, `time blocking app`, `focus timer`

**Secondary (the mechanics / wedge):**
`distraction blocker`, `anti-distraction`, `distraction capture`, `parking lot`,
`accountability app`, `weekly planner`, `focus and accountability`, `concentration`

**Long-tail / intent (lowest competition, write these into Play full description):**
`app to stop task switching`, `stay focused on one thing`, `app for side hustle and
full-time job`, `focus app for ADHD`, `weekly review app`, `app to capture distractions
without losing focus`, `single tasking app for builders`

> Validate volumes/difficulty in a real ASO tool before launch (App Radar, AppTweak,
> MobileAction, Sensor Tower, or Apple's own Search Ads "Search Match" suggestions).
> The lists above are the strategy; the tool gives you the numbers.

---

## 1. Apple App Store — copy-paste listing

### App name / title — **max 30 chars**
```
onelane: Focus & Single-Task
```
*(28 chars.)* Brand first (so brand searches win), then the two highest-value
keywords. Alternatives if you want a different keyword mix:
- `onelane: Deep Work & Focus` (26)
- `onelane — Focus & Deep Work` (27)

### Subtitle — **max 30 chars** (indexed; use *different* keywords than the title)
```
Single-task, capture, finish
```
*(28 chars.)* Alternatives:
- `Stay in one lane & get it done` (30)
- `Deep work, no distractions` (26)

### Keyword field — **max 100 chars**, comma-separated, **no spaces**, **no repeats**
Do **not** repeat words already in the title/subtitle (`focus`, `single`, `task`,
`capture`, `finish`, brand). Singular forms only (Apple handles plurals). Drop the
word "app" (Apple appends category context). Recommended:
```
deepwork,productivity,timeblock,planner,antidistraction,parkinglot,accountability,adhd,habit,goals
```
*(98 chars.)* Swap in winners from your tool research; keep it ≤100 and comma-only.

### Promotional text — **max 170 chars** (NOT indexed; editable anytime, no review)
```
Stay in one lane. onelane protects your focus, lets you park distractions in seconds, and turns your weekly plan into visible progress. Free on iPhone and iPad.
```
*(~160 chars.)* Use this for launch hooks, seasonal angles, "new in v1.1", etc.

### Description — **max 4000 chars** (NOT indexed on iOS → write for the human/conversion)
Use the body from §3 (the Play full description) — it reads well for humans too. Just
remember it does **not** affect iOS ranking, so optimize it purely for "does this make
someone tap *Get*."

### Other App Store Connect fields
- **Primary category:** Productivity. **Secondary:** Health & Fitness *or* Lifestyle.
- **What's New:** ship a real changelog each release (signals an active app).
- **Privacy ("Nutrition label"):** declare data collection honestly. onelane is
  self-report and stores plan/session data in Firebase — disclose accordingly.
- **Privacy policy URL: required.** ⚠️ Does not exist yet — see Known gaps.
- **Support URL: required.** ⚠️ Does not exist yet — see Known gaps.
- **App Store Tags (WWDC '25):** Apple auto-generates these from your metadata +
  screenshots; you can't set them directly, so make the metadata explicit about
  "focus", "single-tasking", "distraction", "weekly plan" and they'll be derived well.

---

## 2. Google Play — copy-paste listing

### Title — **max 30 chars**
```
onelane: Focus & Single-Task
```
*(28 chars — same as iOS.)*

### Short description — **max 80 chars** (INDEXED, heavily weighted → put a keyword in)
```
Stay in one lane: protect focus, park distractions, finish your week.
```
*(69 chars.)* Alternatives:
- `Focus app for single-tasking, distraction capture & weekly closure.` (66)
- `Deep work, distraction parking lot & weekly review. Stay in one lane.` (68)

### Full description — **max 4000 chars** (INDEXED → see §3; weave keywords, ~2–3% density)

### Other Play Console fields
- **App category:** Productivity. **Tags:** pick the closest Play tags (e.g.
  Productivity, Planning, Time management).
- **Privacy policy URL: required** (same gap as iOS).
- **Data safety form:** mirror the Apple privacy disclosures.
- Google Play weights **retention** heavily — see §5.

---

## 3. Shared long description (Play full description / Apple description)

Lead with the hook, state the problem, list the three pillars, name who it's for, then
the principles and a CTA. Keywords (focus, single-tasking, distraction, productivity,
deep work, weekly) are woven naturally — readable first, ~2–3% density for Play.

```
Stay in one lane.

onelane is a focus and accountability app for people running more than one serious
thing — a full-time job alongside trading, a SaaS, a side hustle, or deliberate
learning. It protects single-tasking, captures distractions without acting on them,
and turns your weekly plan into visible, sustainable progress. It's a mirror and a
guardrail — not a taskmaster.

THE PROBLEM: DRIFT
You sit down to do one thing. An impulse for another hits. You chase it, abandon it,
start a third. You set out to do X, which needs Y, which needs Z — and an hour later
you've forgotten X. You work hard all week and still feel like nothing got done.
Time trackers only tell you where the time went, after it's gone. onelane stops the
drift while it's happening.

THREE THINGS, WORKING TOGETHER
• Single-tasking — Commit to one lane (a life domain) for a focus block and stay there.
  Your one intended outcome stays pinned the whole time. The timer survives a locked or
  closed phone.
• Distraction capture — A 5-second parking lot for off-task thoughts. Honored without
  being obeyed, so you note an idea without context-switching to chase it. You can even
  park a thought straight from the lock-screen notification — no unlock, no app-switch,
  no leaving your lane.
• Closure — End every block knowing what got done. Scattered effort becomes a clear,
  visible record. A weekly review shows planned vs. actual for each lane.

HOW IT WORKS
1. Plan the week — give each life domain a flexible hour budget, not rigid clock blocks.
2. Enter a lane — pick a domain, state the one outcome, start the timer.
3. Park distractions — capture off-task thoughts in a tap; triage them later.
4. Close the block — one line on what got done; a calm check-in, never nagging.
5. See your week — planned vs. actual per lane, a simple trend, honest reflection.

WHO IT'S FOR
Operators and builders who are ambitious and self-directed but lose momentum to
context-switching and a lack of visible progress — and who won't tolerate heavy manual
logging. Every action in onelane takes under five seconds.

DESIGNED TO PROTECT YOU, NOT PERFECT YOU
• Progress over perfection — hitting ~70% of an ambitious plan is a win, not a failure.
• Sustainable over maximal. Low friction. Calm, not nagging.
• Honest by design — self-report, not surveillance. A single miss never resets you.

Stay in one lane. Protect your real priorities. End the week with something to show.

Download onelane free for iPhone and Android.
```

> Keep this in sync with the landing page copy (`web/app/page.tsx`) and `web/lib/faq.ts`.
> If the **70% win rule** changes (`WIN_THRESHOLD` in the mobile domain), update it here too.

---

## 4. Visual ASO (in 2026, this usually beats text)

The icon + first screenshot + rating is what a user sees *before* the name — it has
~1–2 seconds to earn the tap.

- **Icon:** the brand mark — yellow (`#FACC15`) rounded square + dark lane bar on the
  asphalt (`#0B0F14`) palette (same as `web/app/icon.svg`). Must read at 1× on a busy
  search row. No text in the icon.
- **Screenshots (the first 2–3 carry it):** use **hybrid captions** — a short benefit
  headline over the screen, with a visual cue. Apple OCRs caption text, so make captions
  keyword-bearing. Suggested order & captions:
  1. "Stay in one lane" — Today screen (lanes at a glance).
  2. "One outcome. One timer." — Focus screen (single-tasking).
  3. "Park distractions in seconds" — lock-screen capture (the standout USP).
  4. "Close every block" — closure / what-got-done.
  5. "See your real week" — weekly review (planned vs. actual, 70% = win).
- **App preview video (optional, strong):** 15–30s of the focus → capture → closure
  loop. Video also helps AI/search surfaces that index transcripts.
- **Google Play feature graphic (1024×500):** required for Play — wordmark + "Stay in
  one lane" on the asphalt palette + the three pillars (reuse the OG image style from
  `web/app/opengraph-image.tsx`).
- Localize screenshot captions per market (see §6).

> Source assets: the landing page ships faithful CSS mockups (`web/components/PhoneMockups.tsx`)
> but the stores want **real device captures**. Capture from the running app at the
> required resolutions before submitting.

---

## 5. Ratings, retention & engagement (the 2026 ranking levers)

Both stores now weight **retention and engagement** over raw install counts.

- **Prompt for ratings at a peak moment** — after a user *closes a block* or *finishes a
  weekly review with a win*, not on launch. Use the native in-app review APIs
  (`SKStoreReviewController` / Play In-App Review). (Not yet implemented — backlog.)
- **Protect Day-1 / Day-7 retention** — the calm notifications/check-ins
  ([notifications.md](notifications.md)) are the retention loop; make sure they bring
  people back without nagging.
- **Reply to reviews** (especially Play) — improves rating and signals an active app.
- **Crash-free rate** is a ranking input — keep it high.

---

## 6. Localization

Localization lifts both reach and ranking (Play favors region-tailored listings; Apple
lets you spread keywords across locales, multiplying indexed terms). It's adaptation,
not raw translation. Launch in English; then prioritize locales by addressable market
(suggested next: es, pt-BR, de, fr, ja). Per locale, localize: title, subtitle/short
description, keyword field, full description, and **screenshot captions**.

---

## 7. Pre-submission checklist

- [ ] Title, subtitle/short description, keyword field, descriptions finalized (§1–§3)
- [ ] Keyword field ≤100 chars, comma-only, no spaces, no repeats of title/subtitle
- [ ] Real device screenshots with hybrid captions (5 each, both stores) (§4)
- [ ] App icon at all required sizes; Play feature graphic (1024×500)
- [ ] (Optional) App preview video
- [ ] **Privacy policy URL** live — page exists at `/privacy`; ⚠️ get it **legal-reviewed** first
- [ ] **Support URL / contact** live — page exists at `/support`; ⚠️ point `SUPPORT_EMAIL` (`web/lib/site.ts`) at a **real monitored inbox**
- [ ] Apple privacy "nutrition label" + Play "data safety" forms filled honestly
- [ ] Categories (Productivity primary), age rating, contact info
- [ ] In-app review prompt wired to a peak moment (§5) *(backlog)*
- [ ] Real store URLs set in `web/lib/site.ts` (`APP_STORE_URL`, `PLAY_STORE_URL`) so
      the landing page download buttons + `llms.txt` point at the live listings
- [ ] Set `NEXT_PUBLIC_SITE_URL` in Vercel if the production domain isn't `onelane.app`

---

## 8. After launch — measure & iterate

- Track keyword rankings, impression→tap (CVR), and Day-1/Day-7 retention weekly.
- **A/B test** the icon and first screenshot (Apple Product Page Optimization / Play
  store listing experiments) — visual changes move CVR the most.
- Iterate the keyword field / short description toward the terms actually converting.
- Refresh promotional text (iOS) and the "What's New" for each release.

---

## Known gaps (blockers & TODO)

- **Privacy & support pages now exist** (`/privacy`, `/support`), but the Privacy
  Policy is a **draft needing legal review** and `SUPPORT_EMAIL` (`web/lib/site.ts`)
  must point at a **real monitored inbox** before submitting. (Also in
  [landing-page.md](landing-page.md).)
- **Real store URLs are placeholders** (`APP_STORE_URL` / `PLAY_STORE_URL` in
  `web/lib/site.ts` are `"#"`). Set them at publish time.
- **No in-app review prompt** wired yet (needed for the ratings/retention lever in §5).
- **Screenshots are CSS mockups**, not real device captures — capture real ones.
- Keyword volumes here are strategic groupings, **not measured** — validate in an ASO
  tool before locking the title/subtitle/keyword field.

---

## 📌 Keeping this doc in sync (read me, Claude)
Update this when the product positioning, the three pillars, the 70% win rule, the
brand palette/icon, or the store fields change. Keep it consistent with
[landing-page.md](landing-page.md) (same positioning), and update the §7 checklist as
gaps (privacy policy, store URLs, in-app review) get closed. Full protocol in
[README.md](README.md).
