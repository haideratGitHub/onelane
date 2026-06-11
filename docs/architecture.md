# Architecture (read this first)

The cross-cutting foundation every other module doc assumes. If you only read one
doc before touching the codebase, read this one.

## 1. What onelane is

A cross-platform focus & accountability app. The defensible wedge (vs Forest /
RescueTime / Toggl / Sunsama / Beeminder) is **anti-drift = single-tasking +
distraction capture + closure**, turning a weekly plan into visible, sustainable
progress. Core metaphor: each life domain is a **lane**; you stay in one lane at a
time. Guiding principle: **progress over perfection — 70% of an ambitious plan is a
win**.

## 2. Repo shape

Two **independent** projects in one repo. There is **no monorepo tooling** (no
Turborepo, no pnpm workspace) and **no shared package** — deliberately. The two apps
share almost no code; the landing page only markets the product.

```
onelane/
├─ mobile/   # Expo (managed) React Native app — the product
├─ web/      # Next.js landing page — marketing, deploys to Vercel
├─ docs/     # these module docs
└─ README.md
```

Each app has its own `package.json` / `node_modules` and is installed and run on its
own (`cd mobile && npm install`, `cd web && npm install`). They use **npm**, not
pnpm.

## 3. Tech stack

**mobile/**
- Expo SDK 52 (managed), React Native 0.76, TypeScript, New Architecture enabled.
- **Expo Router** (file-based routing) — `mobile/app/`.
- **NativeWind v4** (Tailwind for RN) — styling via `className`. Config in `mobile/tailwind.config.js`, directives in `mobile/global.css`, wired through `metro.config.js` + `babel.config.js`.
- **React Native Firebase** (`@react-native-firebase/{app,auth,firestore}`) — Auth + Firestore. **Namespaced API** (e.g. `firestore().collection(...)`), not the modular API.
- **`@react-native-google-signin/google-signin`** — Google sign-in.
- **`expo-notifications`** — local scheduled notifications only (no FCM).
- **Zustand** — app state. **No Redux, no TanStack Query** (Firestore listeners are the live data source).
- Pure domain logic in `mobile/src/domain/` (framework-free, unit-tested with **vitest**).

**web/**
- Next.js 15 (App Router) + React 19, TypeScript.
- Tailwind v3, **framer-motion** (animations), **lucide-react** (icons).
- No Firebase, no backend — fully static; deploys to Vercel.

### ⚠️ Native modules → custom dev build required
Google Sign-In and React Native Firebase are native modules. **The app will not run
in Expo Go.** You must use a custom dev build: `npx expo run:ios` / `run:android`
(or an EAS dev build). See [auth.md](auth.md) for the native config files needed.

## 4. There is no API server

All data access is the Firebase **client SDK** talking straight to Firestore.
Authorization is enforced by **Firestore security rules** (`mobile/firestore.rules`),
not by a server. The app's "data API" is the set of functions in
`mobile/src/firebase/repositories.ts`. When a doc says "endpoint", it means one of
those functions and the Firestore operation it runs. Details in
[data-firestore.md](data-firestore.md).

## 5. 🔑 Load-bearing conventions

These are assumed everywhere. Break them and things silently rot.

### 5.1 All timestamps are epoch milliseconds (`number`)
Every time value in the domain model (`startAt`, `endAt`, `createdAt`, segment
`start`/`end`, week `startsAt`) is a **plain `number` of epoch ms** — never a
Firestore `Timestamp`, never an ISO string. Why:
- Portable across the web Firebase JS SDK and React Native Firebase (their
  `Timestamp` classes differ).
- Makes the timer trivial: `elapsed = now - startAt`.
- A Firestore document is therefore just the domain object **minus its `id`** (the
  `id` is the doc id). That's why the repository (de)serialization is two one-line
  helpers (`toDoc` / `fromDoc`).

Consequence: we **do not use `serverTimestamp()`** for domain data — we use client
time. This is intentional (it's a self-report app — "honesty by design"). The one
exception is the landing-page waitlist… which no longer exists, so: none.

### 5.2 The timer is timestamp-based, never an interval counter
JavaScript does **not** run while the app is backgrounded, and an iOS-terminated app
can't respond to notification taps. So elapsed time is **always recomputed from
stored timestamps** (`elapsedMs(session, now)`), never accumulated by a `setInterval`
tick. The 1-second interval in `useElapsed` only drives a UI redraw; the value it
shows is recomputed from `Date.now()` each tick and **self-corrects** after
backgrounding. Never "fix" the timer by storing a running counter — that
reintroduces the background bug. See [domain-model.md](domain-model.md) §session and
[focus-session.md](focus-session.md).

### 5.3 Pure domain logic takes `now`/`date` as a parameter
Functions in `mobile/src/domain/` never call `Date.now()` / `new Date()` internally
(except where a default is convenient at call sites). They take the current time as
an argument. This keeps them deterministic and unit-testable. Keep it that way.

### 5.4 Single active session invariant
At most **one** session has `status === "active"` per user at a time. The app reads
"the active session" via a `where("status","==","active").limit(1)` listener. The UI
funnels you back to the existing active session instead of starting a second one.
There is currently **no hard DB guard** enforcing this — respect it in code. See
[focus-session.md](focus-session.md) caveats.

## 6. State & live-sync model

```
Firestore  ──onSnapshot──►  useAppSync(uid)  ──►  Zustand (useApp)  ──►  screens
   ▲                                                     │
   └──────────────  repository writes  ◄─────────────────┘  (actions)
```

- **`useAuth`** (`mobile/src/store/useAuth.ts`) holds the Firebase user +
  `initializing` flag. `useAuthListener()` (mounted in `app/_layout.tsx`) feeds
  `onAuthStateChanged` into it.
- **`useApp`** (`mobile/src/store/useApp.ts`) holds all per-user data: `domains`,
  `weekId`, `week`, `weekSessions`, `activeSession`, `parking`, plus `settings` and
  the action methods.
- **`useAppSync(uid)`** (mounted in `app/(app)/_layout.tsx`) attaches the Firestore
  `onSnapshot` listeners and writes their results into `useApp`. It re-subscribes
  when `uid` changes and tears down on unmount.
- **Actions** (e.g. `startSession`, `setDomainTarget`) update the store optimistically
  *and* write to Firestore; the listener then reconciles. This makes the UI feel
  instant while Firestore offline-persistence handles connectivity.

## 7. Navigation map (Expo Router)

```
app/
├─ _layout.tsx          Root Stack. Mounts auth listener, configures Google Sign-In,
│                       sets up notifications, gates on `initializing` (splash).
├─ sign-in.tsx          "/sign-in" — Google sign-in screen.
├─ (app)/               Authenticated area (group → no URL segment).
│  ├─ _layout.tsx       Auth GATE (redirect to /sign-in if no user) + useAppSync + Tabs.
│  ├─ index.tsx         "/"        Today (home)
│  ├─ plan.tsx          "/plan"    Weekly plan / lanes
│  ├─ review.tsx        "/review"  Weekly review
│  └─ parking.tsx       "/parking" Parking-lot triage
├─ session/
│  ├─ start.tsx         "/session/start"  (modal) pick lane + outcome
│  └─ [id].tsx          "/session/[id]"   focus session screen
└─ capture.tsx          "/capture"        (modal) 5-second parking capture
```
- The `(app)` group's `index` serves `/`; there is intentionally **no
  `app/index.tsx`** (it would collide with `(app)/index.tsx`).
- `session/*` and `capture` live at the root level so they present over the tabs;
  the `(app)` layout (and thus `useAppSync`) stays mounted beneath them.
- Hrefs are passed as plain strings (`router.push("/session/" + id)`); typed-route
  types are generated by Expo into `.expo/types` when you run the dev server.

## 8. Theming

- Mobile colors live in `mobile/tailwind.config.js` (and mirrored constants in
  `mobile/src/theme.ts` for inline `style={{}}` use where dynamic).
- Web colors live in `web/tailwind.config.ts`.
- **The lane palette is duplicated in both apps and must be kept in sync by hand**
  (office `#3B82F6`, trading `#10B981`, saas `#8B5CF6`, learning `#F59E0B`, gym
  `#EF4444`; brand line yellow `#FACC15`, ink `#0B0F14`). If you change a brand
  color, change it in `mobile/tailwind.config.js`, `mobile/src/theme.ts`,
  `mobile/src/domain/constants.ts` (DEFAULT_DOMAINS), and `web/tailwind.config.ts`.

## 9. Run / build / test

```bash
# Mobile
cd mobile
npm install
npm test                 # vitest — domain logic (34 tests)
npm run typecheck        # tsc --noEmit
npx expo run:ios         # custom dev build (NOT Expo Go)

# Web
cd web
npm install
npm run dev              # http://localhost:3000
npm run build            # static production build
npm run typecheck
```

Before a native mobile build: add `GoogleService-Info.plist` + `google-services.json`
to `mobile/`, copy `mobile/.env.example` → `.env`, and deploy
`mobile/firestore.rules`. See [auth.md](auth.md) and [data-firestore.md](data-firestore.md).

## 10. Known gaps (system-wide)

- **Settings aren't persisted.** `useApp.settings` defaults to `DEFAULT_SETTINGS`
  (Monday week start, quiet hours, etc.) and is never read from / written to
  Firestore yet. There is no settings screen.
- **Single week only.** The app always works on the current week (`getWeekId(now)`);
  there's no week switcher and no cross-week history fetch, so streaks aren't wired
  into the UI yet (the math exists — see [weekly-review.md](weekly-review.md)).
- **No domain create/archive UI.** Lanes come from `DEFAULT_DOMAINS` on first login;
  the Plan screen edits target hours only.
- **Notification action responses aren't handled** (the buttons exist as a category
  but no response listener writes a check-in yet). See [notifications.md](notifications.md).
- **No hard guard** on the single-active-session invariant.

---

## 📌 Keeping this doc in sync (read me, Claude)
This is the system-foundation doc. Update it whenever you change a **cross-cutting
convention** (timestamp format, timer approach, state/sync model, navigation
structure, theming, the no-server stance) or the repo/stack shape. For
module-local changes, update that module's doc instead. Follow the full protocol in
[README.md](README.md).
