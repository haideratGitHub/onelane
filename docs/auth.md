# Authentication Module

Email/password **and Google** sign-in via the **Firebase JS SDK**, the first-login
bootstrap, the auth gate that protects the app, and sign-out. Google goes through a
small server-side **auth broker** hosted in `web/` (see below) so it works in Expo Go.

> **⚠️ Interim setup.** This module was migrated off native modules
> (`@react-native-firebase`, `@react-native-google-signin`) to the **pure-JS Firebase
> SDK** so the app runs in **Expo Go** (no custom dev build). Native Google Sign-In
> can't work there (native module; and Google OAuth can't redirect to `exp://` URLs
> since Expo removed its auth proxy) — so Google sign-in is implemented as a
> **broker flow**: the system browser → our server (`web/app/api/auth/google/*`) →
> Google OAuth → server mints a Firebase **custom token** (Admin SDK) → deep link
> back → `signInWithCustomToken`. Re-adding *native* Google in a dev build remains
> an optional follow-up. See [architecture.md](architecture.md) §3.

## Files

| File | Role |
|---|---|
| `mobile/src/firebase/config.ts` | Reads `EXPO_PUBLIC_FIREBASE_*` env → `firebaseConfig` + the `isFirebaseConfigured` flag. |
| `mobile/src/firebase/firebase.ts` | **Conditionally** initializes the Firebase JS SDK (only when configured — exports are `null` otherwise, no crash); `fbAuth` (AsyncStorage persistence) + `db` (long-polling Firestore). |
| `mobile/src/firebase/auth.ts` | `signUpWithEmail`, `signInWithEmail`, `signInWithGoogle` (+ `isGoogleSignInAvailable`), `signInAsDemo`, `signOutEverywhere`, `onAuthChanged`, `friendlyAuthError` (maps Firebase `auth/*` codes → human sentences); defines the app-facing **`AuthUser`** type. |
| `web/lib/auth-broker.ts` | Broker helpers: HMAC-signed OAuth `state` (carries the app's return deep link; 10-min expiry; allowed schemes `exp://`/`exps://`/`onelane://`), lazy `firebase-admin` init, `upsertFirebaseUser` (find-or-create by email). |
| `web/app/api/auth/google/start/route.ts` | Validates the `return` deep link and redirects the system browser to Google's consent screen (server is the OAuth `redirect_uri`). |
| `web/app/api/auth/google/callback/route.ts` | Exchanges the code, checks `aud`/`iss`/`email_verified` on the id_token, upserts the Firebase user, mints a **custom token**, deep-links it (or an `?error=`) back into the app. |
| `mobile/src/firebase/demo.ts` | **Demo mode**: in-memory auth + data backend with seeded sample data, used when Firebase isn't configured. |
| `mobile/src/store/useAuth.ts` | Zustand store holding `{ user, initializing }` + `useAuthListener()`. `user` is **`AuthUser`** (decoupled from Firebase types). |
| `mobile/app/_layout.tsx` | Mounts `useAuthListener()`, gates the splash on `initializing`. |
| `mobile/app/sign-in.tsx` | The sign-in screen: a **centered, minimal brand block** (logo mark + "onelane" + the one-line tagline — no marketing paragraph; the landing page carries that) above the email + password form with a Sign in / Create account toggle. Keyboard-aware via the shared `ScreenScroll` primitive (`components/ui.tsx`), return-key chaining (email → password → submit). Password uses `PasswordField` (eye toggle). |
| `mobile/app/(app)/_layout.tsx` | **Auth gate**: redirects to `/sign-in` when there's no user. |
| `mobile/app/(app)/profile.tsx` | Profile tab: identity card, app settings, and the "Sign out" button (with confirmation). |
| `mobile/app.config.ts` | Expo config — no native auth plugins anymore (Firebase is configured at runtime from env). |
| `mobile/.env.example` | The `EXPO_PUBLIC_FIREBASE_*` env vars the app reads. |

## Data touched

- **Firestore `users/{uid}`** — `{ profile: { displayName, email, photoURL } }`,
  written (merged) on every sign-in/up by `ensureUserDoc` (in `repositories.ts`).
  (For email/password, `displayName`/`photoURL` are typically `null`.)
- **No lane seeding.** New users deliberately start with **zero lanes** and build
  their own (the lane editor offers `LANE_TEMPLATES` as prefills). The old
  `bootstrapDomains`/default-lanes seeding was removed. See
  [weekly-plan.md](weekly-plan.md).

## End-to-end flow

1. **App launch** (`app/_layout.tsx`): `useAuthListener()` subscribes to
   `onAuthStateChanged`. While `useAuth.initializing` is true the splash stays up and
   the root renders `null`. The Firebase JS SDK restores the persisted session from
   AsyncStorage.
2. **First auth callback** sets `user` (or `null`) and flips `initializing=false`;
   splash hides.
3. **Routing**: `app/index` doesn't exist; `/` resolves to `(app)/index`, whose
   layout (`(app)/_layout.tsx`) checks `useAuth.user`. **No user → `<Redirect href="/sign-in" />`.**
4. **Sign-in screen** → user enters email + password and taps Sign in / Create
   account, **or taps "Continue with Google"**:
   - `signInWithEmail` → `signInWithEmailAndPassword(fbAuth, …)`, or
   - `signUpWithEmail` → `createUserWithEmailAndPassword(fbAuth, …)`, or
   - `signInWithGoogle` → `WebBrowser.openAuthSessionAsync` to
     `${EXPO_PUBLIC_AUTH_BROKER_URL}/api/auth/google/start?return=<deep link>`
     (return = `Linking.createURL("sign-in")` — `exp://…/--/sign-in` in Expo Go,
     `onelane://sign-in` in builds). The broker runs Google OAuth server-side and
     redirects back with `?token=<custom token>` → `signInWithCustomToken(fbAuth, token)`.
     Cancelling the browser sheet resolves to `null` (no error alert).
   - All then run `ensureUserDoc(uid, profile)` (merge) via the shared
     `afterAuth` helper. No lane seeding (see "Data touched").
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
from the email prefix, and — like a real first run — **no lanes are seeded**. "Continue
with Google" likewise falls back to a fake local Google
user (no browser round-trip). A tertiary "Skip — explore with sample data" button calls
`signInAsDemo()`, which seeds the full sample world (lanes + sessions + parking) via
`seedDemoData({withSamples:true})`. Nothing persists or syncs; data resets on reload.

Caveats: the demo uid is always `"demo"` and the in-memory world is shared for the
JS session — signing out and back in with a different email reuses the same data
(`seedDemoData` is idempotent).

## Configuration & prerequisites (for real accounts)

> **Dev vs prod:** the root [README's "Auth environments"](../README.md#auth-environments-dev-now--prod-later)
> section is the runbook for which Firebase project / Vercel env / Google client
> belongs to which environment (dev = Vercel Preview + `dev` branch broker URL;
> prod = Vercel Production at launch). The steps below apply per environment.

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

**Additionally, for Google sign-in** (the broker in `web/`):

4. **Enable Google** in Firebase console → Authentication → Sign-in method (done).
5. **Broker env** (`web/.env.example` → Vercel project env / `web/.env.local`):
   `GOOGLE_OAUTH_CLIENT_ID` + `GOOGLE_OAUTH_CLIENT_SECRET` (the Google **web**
   client — Firebase console → Google provider → "Web SDK configuration") and
   `FIREBASE_SERVICE_ACCOUNT` (Project settings → Service accounts → generate key;
   raw JSON or base64). Optional: `AUTH_BROKER_ORIGIN`, `AUTH_STATE_SECRET`.
6. **Authorized redirect URI** on that Google web client (Google Cloud console →
   Credentials): `https://<web-domain>/api/auth/google/callback` — plus
   `http://localhost:3000/api/auth/google/callback` for local dev.
7. **Point the app at the broker**: `EXPO_PUBLIC_AUTH_BROKER_URL` in `mobile/.env`
   (the deployed `web/` URL). It must be **public https** — Google rejects private
   LAN IPs as redirect URIs, and `localhost` on the phone is the phone itself; for
   pre-deploy testing, tunnel `web/` (e.g. `ngrok http 3000`) and register the
   tunnel's callback URL. Empty → the Google button is hidden. Env is inlined at
   bundle time — restart `npm run start` after changing it.

## Features / behaviors

- **Providers: email/password + Google** (via the broker — no native modules,
  works in Expo Go). No Apple yet.
- **Google ↔ email/password share an account**: the broker upserts the Firebase
  user **by email** (`upsertFirebaseUser`), so signing in with Google after
  email/password (same address) lands in the same uid / same Firestore data.
- **Google button visibility** — `isGoogleSignInAvailable`: shown in demo mode
  (fake local Google user) or when `EXPO_PUBLIC_AUTH_BROKER_URL` is set; hidden
  when Firebase is configured but no broker URL is.
- **First-login bootstrap is the user doc only** — no default lanes; the new user
  builds their own (templates in the lane editor help).
- **`onAuthChanged`** is the single source of auth truth; everything reacts to it.
- **Splash gating** prevents a sign-in flash before Firebase restores the session.
- **AsyncStorage persistence** keeps the user signed in across reloads/relaunches.
- **Friendly error copy** — every sign-in/up failure goes through
  `friendlyAuthError` (auth.ts): known `auth/*` codes map to plain, actionable
  sentences ("That email already has an account. Try signing in instead."); unknown
  errors get a generic fallback. **Never show raw Firebase messages** ("Firebase:
  Error (auth/…)") to users.
- **Keyboard-aware sign-in form** — uses the shared `ScreenScroll` primitive
  (`components/ui.tsx`; see [architecture.md](architecture.md) §8.1): the focused
  input scrolls above the keyboard, buttons stay tappable while it's open, and the
  return key chains email → password → submit. `Field` (in
  `components/ui.tsx`) accepts a `ref` (React 19 ref-as-prop) for the focus chain.
- **Show/hide password** — `PasswordField` (`components/ui.tsx`) wraps the input
  with an Ionicons eye toggle (`@expo/vector-icons`, bundled with Expo) and owns
  `secureTextEntry` itself; don't pass it from the caller.
- **TextInput font-size gotcha** — `Field`/`PasswordField` use `text-[16px]`, not
  `text-base`: Tailwind's `text-base` also sets `lineHeight`, which makes iOS
  `TextInput` clip descenders (g, y, p). Keep fontSize-only classes on inputs.

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
- **Error surfacing** — sign-in/up errors are shown via `Alert`, always passed
  through `friendlyAuthError` (never the raw Firebase message). Broker failures come
  back as `?error=` on the deep link; those strings are broker-authored (already
  human-readable) but still flow through the same alert path.
- **Custom-token users have no `google.com` providerData** — the broker mints a
  custom token rather than linking the Google provider, so Firebase shows the user
  as "custom" auth. Profile fields (displayName/photo) are set on the user record
  by `upsertFirebaseUser`. If real provider linkage ever matters, that's the native
  dev-build follow-up.
- **The custom token rides the deep link's query string** (~1 min validity, single
  use, only over the broker→app redirect). The broker refuses non-app return
  schemes, so it can't be pointed at an attacker URL; an invalid/expired `state`
  is a hard 400 (the return URL itself can't be trusted then).
- **`WebBrowser.maybeCompleteAuthSession()`** is called at module top of
  `sign-in.tsx` — keep it if the screen is ever split up.

## Known gaps

- **Native Google Sign-In** (account picker sheet, real `google.com` provider
  linkage) — optional follow-up in a custom dev build; the broker flow covers
  Google sign-in until then.
- No password reset, account deletion, re-auth, or profile editing.
- No Apple sign-in.
- User settings (week start, quiet hours) aren't loaded/saved (see [architecture.md](architecture.md) §10).

---

## 📌 Keeping this doc in sync (read me, Claude)
Update this when you touch sign-in/out, the auth gate, the bootstrap, the
`users/{uid}` shape, the Firebase JS SDK init, the env config for auth, **or the
Google auth broker in `web/`** (routes, state signing, upsert semantics — keep the
mobile flow and broker described here in lockstep). If native Google sign-in is
ever added (dev build), document the native config + env it needs.
Full protocol in [README.md](README.md).
