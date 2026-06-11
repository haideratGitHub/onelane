# CLAUDE.md — onelane

This file loads on every request. It tells you **what onelane is** and, crucially,
**which `docs/` files to read for any given task** so you work with full context and
without regressions. Read the relevant docs *before* editing — don't re-derive the
codebase from scratch.

---

## 🧭 How to handle every request (do this first)

1. **Identify the module(s)** the request touches (use the router table below — it
   can be one or more).
2. **Read the matching `docs/*.md` in full** before writing any code. If the task is
   cross-cutting or you're unsure, also read [docs/architecture.md](docs/architecture.md).
   Each doc is written to give you 100% context for that module (flow, data,
   features, caveats, gotchas, known gaps).
3. **Implement** the change, honoring the load-bearing conventions below and the
   per-module caveats the docs call out.
4. **Update the docs in the same change.** When you change a module, update its
   `docs/*.md` (Files / Data model / Flow / Features / Caveats / Known gaps). A task
   is not done until its docs match the code. Full rule: the maintenance protocol in
   [docs/README.md](docs/README.md).
5. **Verify**: run the relevant checks (see Commands).

Do **not** start editing before reading the matching docs. If the docs are already
stale, fix the staleness as part of the work and say so.

## 🗂 Doc router — map the request to docs

| If the request is about… | Read |
|---|---|
| Anything cross-cutting; structure, conventions, state/sync, navigation, theming; "where does X live" | [docs/architecture.md](docs/architecture.md) (start here when unsure) |
| Timer / week / streak / review **math**, domain types, the win rule, anything in `mobile/src/domain/` | [docs/domain-model.md](docs/domain-model.md) |
| Sign-in/out, Google→Firebase, the auth gate, first-login bootstrap, `users/{uid}` | [docs/auth.md](docs/auth.md) |
| Firestore schema, repository functions, queries/indexes, security rules, live sync | [docs/data-firestore.md](docs/data-firestore.md) |
| Starting/timing/pausing/closing a focus block, the timer UI, the yak-shave nudge | [docs/focus-session.md](docs/focus-session.md) |
| Distraction capture & triage | [docs/parking-lot.md](docs/parking-lot.md) |
| Lanes (domains), weekly hour budgets, right-sizing | [docs/weekly-plan.md](docs/weekly-plan.md) |
| Planned-vs-actual, reflections, streaks display | [docs/weekly-review.md](docs/weekly-review.md) |
| Check-ins / local notifications / quiet hours | [docs/notifications.md](docs/notifications.md) |
| The marketing site in `web/` (sections, animations, icons, store buttons) | [docs/landing-page.md](docs/landing-page.md) |
| Logo / app icon / branding assets | [docs/design-brief.md](docs/design-brief.md) |

Many tasks span modules — e.g. "make notification check-ins actually record a
response" touches [notifications.md](docs/notifications.md) **+**
[focus-session.md](docs/focus-session.md) **+** [data-firestore.md](docs/data-firestore.md).
Read all the relevant ones.

---

## What onelane is

A cross-platform focus & accountability app. The wedge (vs Forest/RescueTime/Toggl/
Beeminder) is **anti-drift = single-tasking + distraction capture + closure**, turning
a weekly plan into visible, sustainable progress. Core metaphor: each life domain is a
**lane**; stay in one lane at a time. Guiding principle: **progress over perfection —
70% of an ambitious plan is a win**. It's a mirror and a guardrail, not a taskmaster.

## Project snapshot

- **Two independent projects in one repo — no monorepo tooling, no shared package.**
  - `mobile/` — the product. Expo (managed) SDK 52, React Native, TypeScript, Expo
    Router, NativeWind, React Native Firebase (Auth + Firestore), Google Sign-In,
    `expo-notifications`, Zustand. Pure domain logic + vitest tests in
    `mobile/src/domain/`.
  - `web/` — Next.js 15 landing page (Tailwind, framer-motion, lucide-react). Static,
    no backend, deploys to Vercel.
- **No custom server.** "Backend" = Firebase accessed directly via the client SDK;
  authorization is Firestore **security rules** (`mobile/firestore.rules`). The data
  "API" is the functions in `mobile/src/firebase/repositories.ts`.

## 🔑 Non-negotiable conventions (full detail in architecture.md §5)

- **All timestamps are epoch milliseconds (`number`)** — never Firestore `Timestamp`
  or ISO strings. A Firestore doc is the domain object minus its `id`. We use **client
  time, not `serverTimestamp()`** (intentional — self-report app).
- **The timer is timestamp-based, never an interval counter.** Elapsed is always
  recomputed from stored timestamps (`elapsedMs(session, now)`) so it survives
  backgrounding/kill. Never store a running counter.
- **Pure domain logic takes `now`/`date` as a parameter** — no `Date.now()` inside
  `mobile/src/domain/`. Keeps it deterministic and testable.
- **Single active session invariant** — at most one session is `status:"active"`;
  the app reads it via `where("status","==","active").limit(1)`. Not DB-enforced;
  respect it in code.
- **Lane/brand colors are duplicated** across `mobile/tailwind.config.js`,
  `mobile/src/theme.ts`, `mobile/src/domain/constants.ts`, and `web/tailwind.config.ts`
  — change all of them together.
- **Native modules ⇒ custom dev build.** The mobile app won't run in Expo Go; use
  `npx expo run:ios|android`.

## Commands

```bash
# Mobile (cd mobile)
npm test            # vitest — domain logic (keep these passing)
npm run typecheck   # tsc --noEmit
npx expo run:ios    # custom dev build (NOT Expo Go)

# Web (cd web)
npm run dev
npm run build
npm run typecheck
```

After domain-logic changes always run `npm test`. After any TS change, run
`typecheck`. After web changes, run `build`.

## Current known gaps (don't assume these exist)

Settings aren't persisted (week start / quiet hours are defaults); only the current
week is loaded (no week switcher, streaks not surfaced in UI); no lane add/archive UI
(target editing only); notification action buttons exist but no response listener
handles taps; single-active-session has no hard guard; store CTA links on the landing
page are `#` placeholders. See each module doc's "Known gaps".

---

**Reminder:** read the routed docs before coding, and update them in the same change.
The docs are the source of truth — keep them that way.
