# Authentication Module

Google Sign-In → Firebase Auth, the first-login bootstrap, the auth gate that
protects the app, and sign-out.

## Files

| File | Role |
|---|---|
| `mobile/src/firebase/firebase.ts` | Exposes the `fbAuth` (and `db`) singletons from React Native Firebase. |
| `mobile/src/firebase/auth.ts` | `configureGoogleSignIn`, `signInWithGoogle`, `signOutEverywhere`, `onAuthChanged`. |
| `mobile/src/store/useAuth.ts` | Zustand store holding `{ user, initializing }` + `useAuthListener()`. |
| `mobile/app/_layout.tsx` | Mounts `useAuthListener()`, calls `configureGoogleSignIn()`, gates the splash on `initializing`. |
| `mobile/app/sign-in.tsx` | The sign-in screen ("Continue with Google"). |
| `mobile/app/(app)/_layout.tsx` | **Auth gate**: redirects to `/sign-in` when there's no user. |
| `mobile/app/(app)/plan.tsx` | Hosts the "Sign out" button (bottom of the Plan screen). |
| `mobile/app.config.ts` | Native plugin config + `extra.googleWebClientId` + iOS URL scheme. |
| `mobile/.env.example` | The env vars the build reads. |

## Data touched

- **Firestore `users/{uid}`** — `{ profile: { displayName, email, photoURL } }`,
  written (merged) on every sign-in by `ensureUserDoc` (in `repositories.ts`).
- **`users/{uid}/domains/*`** — seeded once on first login by `bootstrapDomains`
  (writes `DEFAULT_DOMAINS`). See [weekly-plan.md](weekly-plan.md) / [data-firestore.md](data-firestore.md).

## End-to-end flow

1. **App launch** (`app/_layout.tsx`): `configureGoogleSignIn()` runs once;
   `useAuthListener()` subscribes to `onAuthStateChanged`. While
   `useAuth.initializing` is true the splash stays up and the root renders `null`.
2. **First auth callback** sets `user` (or `null`) and flips `initializing=false`;
   splash hides.
3. **Routing**: `app/index` doesn't exist; `/` resolves to `(app)/index`, whose
   layout (`(app)/_layout.tsx`) checks `useAuth.user`. **No user → `<Redirect href="/sign-in" />`.**
4. **Sign-in screen** → user taps "Continue with Google" → `signInWithGoogle()`:
   - `GoogleSignin.hasPlayServices()` then `GoogleSignin.signIn()` → returns
     `response.data.idToken` (google-signin **v13** shape).
   - `auth.GoogleAuthProvider.credential(idToken)` → `fbAuth.signInWithCredential(credential)`.
   - `ensureUserDoc(uid, profile)` (merge) + `bootstrapDomains(uid)` (idempotent).
5. `onAuthStateChanged` fires → `useAuth.user` set → `(app)` gate now renders the
   Tabs; `useAppSync(uid)` (in the same layout) starts the Firestore listeners.
6. **Sign-out** (Plan screen → `signOutEverywhere`): `GoogleSignin.signOut()` (best
   effort) + `fbAuth.signOut()` → listener sets `user=null` → gate redirects to
   `/sign-in`.

## Configuration & prerequisites (must do before it works)

Google Sign-In + RN Firebase are **native** → **custom dev build required** (not Expo
Go). Before the first `expo run:ios|android`:

1. **Firebase config files** in `mobile/`:
   - iOS: `GoogleService-Info.plist` (path overridable via `GOOGLE_SERVICES_PLIST`).
   - Android: `google-services.json` (overridable via `GOOGLE_SERVICES_JSON`).
   Both are **gitignored**. RN Firebase auto-initializes from these — there is no
   `initializeApp()` call in code.
2. **Env** (`mobile/.env`, from `.env.example`):
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` — the **Web** OAuth client ID (used to mint
     the idToken we exchange for a Firebase credential; required on both platforms).
     Surfaced to JS via `app.config.ts` → `extra.googleWebClientId` → read in
     `auth.ts` through `expo-constants`.
   - `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME` — reversed iOS client id, injected into the
     `@react-native-google-signin/google-signin` config plugin in `app.config.ts`.
3. **Enable Google** as a sign-in provider in the Firebase console.
4. **Deploy security rules** (`mobile/firestore.rules`) so `users/{uid}` is
   writable only by that uid.

## Features / behaviors

- **Single provider: Google.** No email/password, no Apple sign-in yet.
- **First-login bootstrap** seeds default lanes so the app isn't empty.
- **`onAuthChanged`** is the single source of auth truth; everything reacts to it.
- **Splash gating** prevents a sign-in flash before Firebase restores the session.

## Caveats / gotchas

- **`response.data?.idToken`** — google-signin v13 nests the token under `.data`.
  Older snippets use `response.idToken` (v12 and earlier) — don't regress to that.
- **No dev build = instant failure.** In Expo Go these native modules are undefined.
- **`bootstrapDomains` isn't transactional.** It checks `domains.limit(1)` then
  batch-writes; two simultaneous first-logins on two devices could double-seed. Low
  risk for a personal app; if it matters, move to a transaction or a `bootstrapped`
  flag on the user doc.
- **`webClientId` may be `undefined`** if env isn't set → `GoogleSignin.configure`
  gets `undefined` and sign-in fails with an opaque error. Check the env first when
  debugging sign-in.
- **`initializing` must flip exactly once.** `setUser` sets `initializing=false`;
  don't add a second code path that leaves it stuck true (splash would hang).
- **Sign-out is in an odd place** (bottom of Plan). If you add a Settings screen,
  move it there and update [weekly-plan.md](weekly-plan.md).

## Known gaps

- No account deletion, no re-auth, no profile editing.
- No Apple sign-in (will be needed for iOS App Store review if you offer other social
  logins — currently only Google, which is allowed alone).
- User settings (week start, quiet hours) aren't loaded/saved (see [architecture.md](architecture.md) §10).

---

## 📌 Keeping this doc in sync (read me, Claude)
Update this when you touch sign-in/out, the auth gate, the bootstrap, the
`users/{uid}` shape, or the native/env config for auth. Keep the env var names and
the google-signin response shape exact. Full protocol in [README.md](README.md).
