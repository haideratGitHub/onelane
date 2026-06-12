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
└─ web/      # Next.js landing page + Google auth broker (deploys to Vercel)
```

## Stack

- **Mobile:** Expo (managed) + React Native + TypeScript, Expo Router, NativeWind — **runs in Expo Go** (no native modules)
- **Web:** Next.js (App Router) + Tailwind, deployed to Vercel; also hosts the **Google auth broker** (`web/app/api/auth/google/*`)
- **Backend:** Firebase — Auth + Firestore via the **JS SDK**, secured by Firestore rules (no data API server)
- **Auth:** email/password + **Google via the broker** (server-side OAuth → Firebase custom token; works in Expo Go) — see [docs/auth.md](docs/auth.md)
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

The marketing page needs no env. The **Google auth broker** routes do — see
`web/.env.example` and the [Auth environments](#auth-environments-dev-now--prod-later)
section below.

### Mobile app (`mobile/`)

```bash
cd mobile
npm install
npm test             # domain-logic unit tests (week/session/streak math)
npm run start        # Expo Go — scan the QR with the Expo Go app
```

No native build needed — the app uses the pure-JS Firebase SDK and runs in
**Expo Go**. Firebase is **required** (the app throws a clear setup error at
startup if it's missing — there is no demo/offline mode):

1. Copy `mobile/.env.example` → `mobile/.env` and fill the
   `EXPO_PUBLIC_FIREBASE_*` web-app config + `EXPO_PUBLIC_AUTH_BROKER_URL`.
2. Enable **Email/Password** and **Google** providers in Firebase console →
   Authentication → Sign-in method.
3. Deploy the security rules: `firebase deploy --only firestore:rules`
   (rules live in `mobile/firestore.rules`).

## Auth environments: dev now / prod later

> **The rule:** the whole auth chain must come from the **same Firebase project**
> per environment — the app's `EXPO_PUBLIC_FIREBASE_*` config, the broker's
> `FIREBASE_SERVICE_ACCOUNT`, and the Google OAuth client. Never mix: a custom
> token minted by the prod service account is rejected by an app running on dev
> Firebase config (and vice versa).

Google sign-in flows through the broker hosted by the `web/` deployment:
app → system browser → `/api/auth/google/start` → Google → `/api/auth/google/callback`
→ custom token → deep link back into the app. Details: [docs/auth.md](docs/auth.md).

### Dev (the current setup)

- **Firebase project (current one = dev):** Email/Password + Google providers enabled.
- **Vercel env vars** (project Settings → Environment Variables), scoped to
  **Preview** (uncheck Production — Production is reserved for prod later):
  - `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` — Firebase console →
    Authentication → Google provider → "Web SDK configuration"
  - `FIREBASE_SERVICE_ACCOUNT` — Project settings → Service accounts →
    Generate new private key (paste the JSON, or its base64)
- **Dev broker URL:** push a long-lived `dev` branch; Vercel aliases it to a stable
  `https://onelane-git-dev-<vercel-account>.vercel.app`. (Check Deployment
  Protection is OFF for previews, or the phone hits a Vercel login wall.)
- **Google client → Authorized redirect URIs** (Google Cloud console → Credentials,
  the *dev* project's web client): `https://<dev-broker-url>/api/auth/google/callback`
- **`mobile/.env` (local dev only, gitignored):** dev `EXPO_PUBLIC_FIREBASE_*` +
  `EXPO_PUBLIC_AUTH_BROKER_URL=https://<dev-broker-url>`. Env is baked at bundle
  time — restart `npm run start` after changing it.

### Prod (checklist for launch — not done yet)

1. [ ] Create the **prod Firebase project**; enable Email/Password + Google
   providers; deploy `mobile/firestore.rules` to it.
2. [ ] Add the same three Vercel env vars scoped to **Production**, with the prod
   project's values (its own Google web client + its own service account key).
3. [ ] Register the prod callback on the **prod** Google client:
   `https://onelane.vercel.app/api/auth/google/callback` (and again for the custom
   domain if one is added later — the broker derives its redirect URI from the
   request host, so the code needs no change).
4. [ ] Give the store build prod env **at build time** (EAS: `env` in `eas.json`
   or EAS secrets — `mobile/.env` is only for local dev): prod
   `EXPO_PUBLIC_FIREBASE_*` + `EXPO_PUBLIC_AUTH_BROKER_URL=https://onelane.vercel.app`.
5. [ ] Sanity-check the chain: sign in with Google on the store build, confirm the
   user appears in the **prod** Firebase Authentication console (not dev).

Never point the published app at a preview URL.

## Status

Early build. The MVP core loop (focus → capture → closure → weekly review) and the
landing page are in place. The domain logic is unit-tested; the app screens need a
device + Firebase project to run end-to-end. See the product plan for the roadmap.
