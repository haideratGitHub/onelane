# Authentication Module

Email/password sign-in via the **Firebase JS SDK**, the first-login bootstrap, the
auth gate that protects the app, and sign-out.

> **⚠️ Interim setup.** This module was migrated off native modules
> (`@react-native-firebase`, `@react-native-google-signin`) to the **pure-JS Firebase
> SDK** with **email/password** auth so the app runs in **Expo Go** (no custom dev
> build). **Google Sign-In is deferred** — it's a native module / needs a custom-scheme
> dev build (Expo removed the auth proxy, so Google OAuth can't redirect in Expo Go).
> Re-adding native Google in a dev build is the planned "more robust" follow-up. See
> [architecture.md](architecture.md) §3.

## Files

| File | Role |
|---|---|
| `mobile/src/firebase/config.ts` | Reads `EXPO_PUBLIC_FIREBASE_*` env → `firebaseConfig` + the `isFirebaseConfigured` flag. |
| `mobile/src/firebase/firebase.ts` | **Conditionally** initializes the Firebase JS SDK (only when configured — exports are `null` otherwise, no crash); `fbAuth` (AsyncStorage persistence) + `db` (long-polling Firestore). |
| `mobile/src/firebase/auth.ts` | `signUpWithEmail`, `signInWithEmail`, `signInAsDemo`, `signOutEverywhere`, `onAuthChanged`; defines the app-facing **`AuthUser`** type. |
| `mobile/src/firebase/demo.ts` | **Demo mode**: in-memory auth + data backend with seeded sample data, used when Firebase isn't configured. |
| `mobile/src/store/useAuth.ts` | Zustand store holding `{ user, initializing }` + `useAuthListener()`. `user` is **`AuthUser`** (decoupled from Firebase types). |
| `mobile/app/_layout.tsx` | Mounts `useAuthListener()`, gates the splash on `initializing`. |
| `mobile/app/sign-in.tsx` | The sign-in screen: email + password form with a Sign in / Create account toggle. |
| `mobile/app/(app)/_layout.tsx` | **Auth gate**: redirects to `/sign-in` when there's no user. |
| `mobile/app/(app)/profile.tsx` | Profile tab: identity card, app settings, and the "Sign out" button (with confirmation). |
| `mobile/app.config.ts` | Expo config — no native auth plugins anymore (Firebase is configured at runtime from env). |
| `mobile/.env.example` | The `EXPO_PUBLIC_FIREBASE_*` env vars the app reads. |

## Data touched

- **Firestore `users/{uid}`** — `{ profile: { displayName, email, photoURL } }`,
  written (merged) on every sign-in/up by `ensureUserDoc` (in `repositories.ts`).
  (For email/password, `displayName`/`photoURL` are typically `null`.)
- **`users/{uid}/domains/*`** — seeded once on first login by `bootstrapDomains`
  (writes `DEFAULT_DOMAINS`). See [weekly-plan.md](weekly-plan.md) / [data-firestore.md](data-firestore.md).

## End-to-end flow

1. **App launch** (`app/_layout.tsx`): `useAuthListener()` subscribes to
   `onAuthStateChanged`. While `useAuth.initializing` is true the splash stays up and
   the root renders `null`. The Firebase JS SDK restores the persisted session from
   AsyncStorage.
2. **First auth callback** sets `user` (or `null`) and flips `initializing=false`;
   splash hides.
3. **Routing**: `app/index` doesn't exist; `/` resolves to `(app)/index`, whose
   layout (`(app)/_layout.tsx`) checks `useAuth.user`. **No user → `<Redirect href="/sign-in" />`.**
4. **Sign-in screen** → user enters email + password and taps Sign in / Create account:
   - `signInWithEmail` → `signInWithEmailAndPassword(fbAuth, …)`, or
   - `signUpWithEmail` → `createUserWithEmailAndPassword(fbAuth, …)`.
   - Both then run `ensureUserDoc(uid, profile)` (merge) + `bootstrapDomains(uid)`
     (idempotent) via the shared `afterAuth` helper.
5. `onAuthStateChanged` fires → `useAuth.user` set → `(app)` gate now renders the
   Tabs; `useAppSync(uid)` (in the same layout) starts the Firestore listeners.
6. **Sign-out** (Profile tab → confirmation Alert → `signOutEverywhere`): `signOut(fbAuth)` → listener sets
   `user=null` → gate redirects to `/sign-in`.

## Demo mode (no Firebase config)

When the `EXPO_PUBLIC_FIREBASE_*` env is **absent**, the app must not crash —
`firebase.ts` skips initialization entirely (`fbAuth`/`db` are `null`) and everything
delegates to `demo.ts` (in-memory backend, same observe/write contracts). The
sign-in screen still shows the **real onboarding form** (with a small demo banner):
`signInWithEmail`/`signUpWithEmail` fall back to `demoSignIn(profileFromEmail(email))`
— any credentials work, the local `AuthUser` (`uid:"demo"`) takes its displayName
from the email prefix, and `afterAuth` seeds the **default lanes only** (clean
first-run feel). A tertiary "Skip — explore with sample data" button calls
`signInAsDemo()`, which seeds the full sample world (sessions + parking) via
`seedDemoData({withSamples:true})`. Nothing persists or syncs; data resets on reload.

Caveats: the demo uid is always `"demo"` and the in-memory world is shared for the
JS session — signing out and back in with a different email reuses the same data
(`seedDemoData` is idempotent).

## Configuration & prerequisites (for real accounts)

Pure-JS Firebase SDK → **runs in Expo Go** (`npm run start`, scan the QR). Before
real sign-in works (otherwise demo mode):

1. **Firebase Web app config** in `mobile/.env` (from `.env.example`) — Firebase
   console → Project settings → Your apps → **Web** app:
   `EXPO_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`,
   `_MESSAGING_SENDER_ID`, `_APP_ID`. Read at runtime in `firebase.ts` via
   `process.env` (Expo inlines `EXPO_PUBLIC_*`). Replaces the old native
   `GoogleService-Info.plist` auto-init.
2. **Enable Email/Password** in Firebase console → Authentication → Sign-in method.
3. **Deploy security rules** (`mobile/firestore.rules`) so `users/{uid}` is writable
   only by that uid: `firebase deploy --only firestore:rules` (rules unchanged).

## Features / behaviors

- **Single provider (interim): email/password.** No Google/Apple/social yet.
- **First-login bootstrap** seeds default lanes so the app isn't empty.
- **`onAuthChanged`** is the single source of auth truth; everything reacts to it.
- **Splash gating** prevents a sign-in flash before Firebase restores the session.
- **AsyncStorage persistence** keeps the user signed in across reloads/relaunches.

## Caveats / gotchas

- **`getReactNativePersistence` is only in firebase/auth's RN build** — the default
  (browser) types don't declare it, so `firebase.ts` has a `// @ts-ignore` on that
  import. Metro resolves the RN build at runtime; don't "fix" the ignore away.
- **`initializeAuth`/`initializeFirestore` run once** — `firebase.ts` wraps each in a
  try/catch falling back to `getAuth`/`getFirestore` so Fast Refresh doesn't crash.
- **`initializing` must flip exactly once.** `setUser` sets `initializing=false`;
  don't add a second code path that leaves it stuck true (splash would hang).
- **Sign-out lives on the Profile tab** behind a confirmation Alert (moved from the
  Plan screen when Profile was added).
- **Error surfacing** — sign-in/up errors are shown via `Alert` with the Firebase
  error message (e.g. wrong-password, email-already-in-use). Fine for the interim app.

## Known gaps

- **Google sign-in deferred** — returns with a native dev build (the "more robust"
  follow-up).
- No password reset, account deletion, re-auth, or profile editing.
- No Apple sign-in.
- User settings (week start, quiet hours) aren't loaded/saved (see [architecture.md](architecture.md) §10).

---

## 📌 Keeping this doc in sync (read me, Claude)
Update this when you touch sign-in/out, the auth gate, the bootstrap, the
`users/{uid}` shape, the Firebase JS SDK init, or the env config for auth. If/when
Google sign-in is re-added (dev build), document the native config + env it needs.
Full protocol in [README.md](README.md).
