# onelane

**Stay in one lane.**

A focus & accountability companion that protects single-tasking, captures distractions without acting on them, and turns a weekly plan into visible, rewarding, sustainable progress.

It is a mirror and a guardrail, not a taskmaster.

## Why

Running a job alongside serious side pursuits (trading, a SaaS, learning) means the categories bleed into each other. You sit down to do one thing, an impulse for another hits, you chase it, abandon it, start a third. Nothing gets its own protected time. By the end of the week you're exhausted and feel like nothing got done.

onelane solves three stacked problems:

1. **Single-tasking** — stay on one task while it's that task's turn.
2. **Distraction capture** — a 5-second "parking lot" for off-task impulses, honored without being obeyed.
3. **Closure** — end each block and the week *knowing* what you accomplished.

The guiding principle: **sustainable over maximal**. 70% of an ambitious plan is a win, not a failure.

## Layout

Two independent projects in one repo — no monorepo tooling. Each is self-contained
with its own `package.json` and `node_modules`.

```
onelane/
├─ mobile/   # Expo app (React Native, Expo Router, NativeWind, Firebase)
│  ├─ app/        # Expo Router screens
│  └─ src/
│     ├─ domain/        # Pure logic: week/session/streak math (+ tests)
│     ├─ firebase/      # Auth + Firestore repositories
│     ├─ store/         # Zustand stores
│     ├─ notifications/ # expo-notifications scheduling
│     └─ components/    # Shared UI
└─ web/      # Next.js landing page (deploys to Vercel)
```

## Stack

- **Mobile:** Expo (managed) + React Native + TypeScript, Expo Router, NativeWind
- **Web:** Next.js (App Router) + Tailwind, deployed to Vercel
- **Backend:** Firebase — Auth (Google), Firestore
- **Auth:** `@react-native-google-signin/google-signin` + Firebase Auth (needs an EAS dev build, not Expo Go)
- **Notifications:** `expo-notifications` (local, scheduled — no FCM)
## Getting started

Requires Node >= 20.

### Landing page (`web/`)

```bash
cd web
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
```

Copy `.env.example` → `.env.local` and add the `NEXT_PUBLIC_FIREBASE_*` values to
persist waitlist emails. Without them the page still builds and runs.

### Mobile app (`mobile/`)

```bash
cd mobile
npm install
npm test             # domain-logic unit tests (week/session/streak math)

# The app uses native modules (Google Sign-In + React Native Firebase), so it
# needs a custom dev build — it will NOT run in Expo Go.
npx expo run:ios     # or: npx expo run:android
```

Before the first native build:
1. Add your Firebase config files to `mobile/`: `GoogleService-Info.plist` (iOS)
   and `google-services.json` (Android). Both are gitignored.
2. Copy `mobile/.env.example` → `mobile/.env` and set the Google client IDs.
3. Deploy the security rules: `firebase deploy --only firestore:rules`
   (rules live in `mobile/firestore.rules`).

## Status

Early build. The MVP core loop (focus → capture → closure → weekly review) and the
landing page are in place. The domain logic is unit-tested; the app screens need a
device + Firebase project to run end-to-end. See the product plan for the roadmap.
