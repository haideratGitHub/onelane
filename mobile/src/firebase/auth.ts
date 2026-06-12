import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { fbAuth } from "./firebase";
import { deleteAllUserData, ensureUserDoc } from "./repositories";

/**
 * Translate an auth failure into a sentence a person can act on. Firebase
 * error messages leak internals ("Firebase: Error (auth/email-already-in-use)")
 * — never show them raw. Unknown codes get a generic fallback.
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use":
    "That email already has an account. Try signing in instead.",
  "auth/invalid-email": "That doesn't look like a valid email address.",
  "auth/weak-password": "Please use a password with at least 6 characters.",
  "auth/missing-password": "Please enter your password.",
  "auth/wrong-password": "Incorrect email or password. Please try again.",
  "auth/invalid-credential": "Incorrect email or password. Please try again.",
  "auth/user-not-found":
    "We couldn't find an account with that email. Try creating one.",
  "auth/user-disabled": "This account has been disabled. Contact support.",
  "auth/too-many-requests":
    "Too many attempts. Please wait a minute and try again.",
  "auth/network-request-failed":
    "Couldn't reach the server. Check your internet connection and try again.",
  "auth/requires-recent-login":
    "For security, this needs a fresh sign-in. Sign out, sign back in, and try again.",
};

export function friendlyAuthError(e: unknown): string {
  const code =
    typeof e === "object" && e !== null && "code" in e
      ? String((e as { code: unknown }).code)
      : null;
  if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
  // Plain Errors we (or the auth broker) threw are already written for humans —
  // pass them through. Anything mentioning Firebase internals stays hidden.
  if (e instanceof Error && !code && e.message && !/firebase|auth\//i.test(e.message)) {
    return e.message;
  }
  return "Something went wrong. Please try again.";
}

/**
 * The app-facing user shape — the only fields the UI reads. Decouples consumers
 * from the Firebase `User` type.
 */
export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

function toAuthUser(u: User): AuthUser {
  return {
    uid: u.uid,
    displayName: u.displayName,
    email: u.email,
    photoURL: u.photoURL,
  };
}

/**
 * Auth via the Firebase JS SDK so the app runs in Expo Go: email/password
 * directly, and Google through the server-side broker (signInWithGoogle below —
 * no native modules). Every entry point upserts the user's doc (idempotent).
 * Deliberately NO lane seeding — a new user starts with zero lanes and builds
 * their own (the lane editor offers templates as a starting point).
 */
async function afterAuth(user: AuthUser): Promise<AuthUser> {
  await ensureUserDoc(user.uid, {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  });
  return user;
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  const { user } = await createUserWithEmailAndPassword(fbAuth, email, password);
  return afterAuth(toAuthUser(user));
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  const { user } = await signInWithEmailAndPassword(fbAuth, email, password);
  return afterAuth(toAuthUser(user));
}

/**
 * Google sign-in via the auth broker hosted in `web/` (see docs/auth.md).
 * Expo Go can't receive a Google OAuth redirect directly (Google rejects exp://
 * URIs), so the system browser is sent to our server, which runs the OAuth flow
 * against Google, mints a Firebase **custom token**, and deep-links it back —
 * we finish with signInWithCustomToken. Works in Expo Go; no native modules.
 */
const AUTH_BROKER_URL = (process.env.EXPO_PUBLIC_AUTH_BROKER_URL ?? "").replace(
  /\/$/,
  "",
);

/** Whether the sign-in screen should offer the Google button. */
export const isGoogleSignInAvailable = !!AUTH_BROKER_URL;

/** Resolves to null when the user cancels/dismisses the browser sheet. */
export async function signInWithGoogle(): Promise<AuthUser | null> {
  if (!AUTH_BROKER_URL) {
    throw new Error(
      "Google sign-in isn't configured — set EXPO_PUBLIC_AUTH_BROKER_URL.",
    );
  }
  // In Expo Go this is exp://<lan-ip>:8081/--/sign-in (a route we're already
  // on, so the deep link is a harmless no-op navigation); in a dev/store build
  // it's onelane://sign-in. The broker validates the scheme.
  const returnUrl = Linking.createURL("sign-in");
  const result = await WebBrowser.openAuthSessionAsync(
    `${AUTH_BROKER_URL}/api/auth/google/start?return=${encodeURIComponent(returnUrl)}`,
    returnUrl,
  );
  if (result.type !== "success") return null;
  const { queryParams } = Linking.parse(result.url);
  const token = typeof queryParams?.token === "string" ? queryParams.token : null;
  if (!token) {
    throw new Error(
      typeof queryParams?.error === "string"
        ? queryParams.error
        : "Google sign-in failed. Please try again.",
    );
  }
  const { user } = await signInWithCustomToken(fbAuth, token);
  return afterAuth(toAuthUser(user));
}

/**
 * Permanent account deletion: wipe all Firestore data, then the Firebase Auth
 * user. The UI owns the "this cannot be undone" double confirmation — this
 * function assumes consent.
 *
 * Firebase only deletes a user whose sign-in is RECENT, so recency is
 * pre-checked BEFORE any data is wiped — a stale session fails fast with
 * instructions instead of stranding a half-deleted account (data gone, login
 * alive). Custom-token (Google-broker) users can't reauthenticate in place,
 * so "sign out, sign back in, delete again" is the one flow that works for
 * every provider.
 */
const RECENT_LOGIN_WINDOW_MS = 5 * 60 * 1000;

export async function deleteAccount(): Promise<void> {
  const user = fbAuth.currentUser;
  if (!user) throw new Error("You're not signed in.");
  const lastSignIn = user.metadata.lastSignInTime
    ? Date.parse(user.metadata.lastSignInTime)
    : 0;
  if (Date.now() - lastSignIn > RECENT_LOGIN_WINDOW_MS) {
    throw new Error(
      "For security, deleting your account needs a fresh sign-in. Sign out, sign back in, then delete your account right away.",
    );
  }
  await deleteAllUserData(user.uid);
  await deleteUser(user); // also signs the user out → the auth gate redirects
}

export async function signOutEverywhere(): Promise<void> {
  await signOut(fbAuth);
}

export function onAuthChanged(
  cb: (user: AuthUser | null) => void,
): () => void {
  return onAuthStateChanged(fbAuth, (u) => cb(u ? toAuthUser(u) : null));
}
