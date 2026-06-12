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

> **mobile install gotcha — `legacy-peer-deps` is required.** Several of Expo's own
> deps (`expo-asset`, `expo-font`, `expo-file-system`) peer-depend on `expo`, so npm 7+
> nests them under `node_modules/expo/node_modules/` instead of hoisting them. Metro's
> flat resolver (`@expo/metro-config`) then can't find them and crashes on start with
> `The required package 'expo-asset' cannot be found`. `mobile/.npmrc` sets
> `legacy-peer-deps=true` to force top-level hoisting — keep that file. Always install
> in `mobile/` with plain `npm install` (it picks up `.npmrc`); if you ever hit the
> error, the fix is `rm -rf node_modules package-lock.json && npm install`, **not**
> `npm ci` against a lockfile that already encodes the nested layout.

## 3. Tech stack

**mobile/**
- Expo SDK 54 (managed), React Native 0.81, React 19, TypeScript, New Architecture
  enabled. (Upgraded from SDK 52 because iOS Expo Go only supports the latest SDK.)
- **Expo Router** (file-based routing) — `mobile/app/`.
- **NativeWind v4.2** (Tailwind for RN) — styling via `className`. Config in `mobile/tailwind.config.js`, directives in `mobile/global.css`, wired through `metro.config.js` + `babel.config.js`. ⚠️ **NativeWind ↔ reanimated coupling:** NativeWind 4.2.x's Babel preset unconditionally adds `react-native-worklets/plugin`, which exists only with **reanimated 4** (`react-native-worklets` is installed; reanimated 4's own `/plugin` just forwards to it). Keep the three in lockstep — NativeWind 4.1.x ↔ reanimated 3, NativeWind 4.2.x ↔ reanimated 4 + worklets. `babel.config.js` deliberately has **no explicit reanimated plugin entry** (the NativeWind preset provides it; adding it again risks a duplicate-plugin error).
- **Firebase JS SDK** (`firebase`) — Auth + Firestore, **modular API** (e.g. `collection(db, …)`, `onSnapshot(query(...))`). *Interim:* migrated off the native `@react-native-firebase` so the app runs in Expo Go. Configured at runtime from `EXPO_PUBLIC_FIREBASE_*` env (no native config file). See [auth.md](auth.md) / [data-firestore.md](data-firestore.md).
- **Auth: email/password + Google** — both via the Firebase JS SDK (no native modules). Google goes through the **auth broker** hosted in `web/` (server-side OAuth → Firebase custom token → `signInWithCustomToken`), so it works in Expo Go. See [auth.md](auth.md).
- **`expo-notifications`** — local scheduled notifications only (no FCM).
- **Zustand** — app state. **No Redux, no TanStack Query** (Firestore listeners are the live data source).
- Pure domain logic in `mobile/src/domain/` (framework-free, unit-tested with **vitest**).

**web/**
- Next.js 15 (App Router) + React 19, TypeScript.
- Tailwind v3, **framer-motion** (animations), **lucide-react** (icons).
- Marketing page is fully static; deploys to Vercel. Plus one server-side piece:
  the **Google auth broker** (`web/app/api/auth/google/*` + `web/lib/auth-broker.ts`,
  `firebase-admin`) that the mobile app uses for Google sign-in — see [auth.md](auth.md).

### ✅ Runs in Expo Go (interim)
The app was migrated off native modules to the pure-JS Firebase SDK + email/password
auth, so it now runs in **Expo Go**: `cd mobile && npm run start`, then scan the QR
with the Expo Go app. No custom dev build needed. (`expo-dev-client` was removed and
the `start` script is plain `expo start` so the QR is Expo-Go-scannable.)

**Google sign-in works in Expo Go anyway** via the auth broker in `web/`: Google
OAuth can't redirect to `exp://` URLs (and Expo removed its auth proxy), so the
system browser is sent to our server, which completes OAuth and deep-links a
Firebase **custom token** back into the app ([auth.md](auth.md)). The optional
"more robust" follow-up remains native Google Sign-In in a custom dev build
(`npx expo run:ios` / `run:android` or EAS); if that happens, this section and
[auth.md](auth.md) get the native config files + dev-build workflow back.

## 4. There is no API server (for data)

All data access is the Firebase **client SDK** talking straight to Firestore.
Authorization is enforced by **Firestore security rules** (`mobile/firestore.rules`),
not by a server. The app's "data API" is the set of functions in
`mobile/src/firebase/repositories.ts`. When a doc says "endpoint", it means one of
those functions and the Firestore operation it runs. Details in
[data-firestore.md](data-firestore.md).

The one server-side exception is **auth-only**: the Google sign-in broker in
`web/` ([auth.md](auth.md)) holds the service-account key and mints custom
tokens. It never reads or writes app data — don't grow it into a data API
(that would forfeit live sync, offline, and the rules-as-authorization model).

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
├─ _layout.tsx          Root Stack. Mounts auth listener, sets up notifications,
│                       gates on `initializing` (splash).
├─ sign-in.tsx          "/sign-in" — email/password sign-in screen.
├─ (app)/               Authenticated area (group → no URL segment).
│  ├─ _layout.tsx       Auth GATE (redirect to /sign-in if no user) + useAppSync + Tabs.
│  ├─ index.tsx         "/"        Today (home)
│  ├─ plan.tsx          "/plan"    Weekly plan / lanes
│  ├─ review.tsx        "/review"  Weekly review
│  ├─ parking.tsx       "/parking" Parking-lot triage
│  └─ profile.tsx       "/profile" Profile: identity, settings, sign out
├─ session/
│  ├─ start.tsx         "/session/start"  (modal) pick lane + outcome
│  └─ [id].tsx          "/session/[id]"   focus session screen
├─ lane/
│  └─ [id].tsx          "/lane/[id]"      (modal) lane editor; "/lane/new" creates
└─ capture.tsx          "/capture"        (modal) 5-second parking capture
```
- The `(app)` group's `index` serves `/`; there is intentionally **no
  `app/index.tsx`** (it would collide with `(app)/index.tsx`).
- `session/*`, `lane/*`, and `capture` live at the root level so they present over
  the tabs; the `(app)` layout (and thus `useAppSync`) stays mounted beneath them.
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
npm run start            # Expo Go: scan the QR (interim — no native modules)
# npx expo run:ios       # only needed if native modules are ever added (dev build)

# Web
cd web
npm install
npm run dev              # http://localhost:3000
npm run build            # static production build
npm run typecheck
```

Before running mobile (Expo Go): copy `mobile/.env.example` → `.env` and fill the
`EXPO_PUBLIC_FIREBASE_*` Web config, enable Email/Password in the Firebase console,
and deploy `mobile/firestore.rules`. For Google sign-in, also set
`EXPO_PUBLIC_AUTH_BROKER_URL` and configure the broker env in `web/`
([auth.md](auth.md)). (No `GoogleService-Info.plist` / `google-services.json`
needed while on the JS SDK — those return only with *native* Google Sign-In, in
a dev build.) See [auth.md](auth.md) and
[data-firestore.md](data-firestore.md).

## 10. Known gaps (system-wide)

- ~~Settings aren't persisted~~ — **done**: settings live in `users/{uid}.settings`,
  edited on the Profile tab; the week listeners re-key on `weekStartsOn` (see
  [data-firestore.md](data-firestore.md)).
- **Single week only.** The app always works on the current week (`getWeekId(now)`);
  there's no week switcher and no cross-week history fetch, so streaks aren't wired
  into the UI yet (the math exists — see [weekly-review.md](weekly-review.md)).
- ~~No domain create/archive UI~~ — **done**: full lane CRUD via the `/lane/[id]`
  editor modal (see [weekly-plan.md](weekly-plan.md)); reorder + unarchive remain
  gaps.
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
