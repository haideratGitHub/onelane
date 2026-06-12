import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { fbAuth } from "./firebase";
import { isFirebaseConfigured } from "./config";
import {
  onAuthChangedDemo,
  seedDemoData,
  signInDemo as demoSignIn,
  signOutDemo,
} from "./demo";
import { ensureUserDoc } from "./repositories";

export { isFirebaseConfigured } from "./config";

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
 * from the Firebase `User` type so demo mode (no Firebase at all) can supply one.
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
 * no native modules). With no Firebase config, the sign-in screen offers demo
 * mode instead. Every entry point upserts the user's doc (idempotent).
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

/**
 * Demo fallback for the real onboarding form: with no Firebase config, any
 * credentials sign in a local fake account named after the email, so the full
 * sign-in/sign-up flow is walkable. Like a real first run, it starts with no
 * lanes (use "Skip — explore with sample data" for a seeded world).
 */
function profileFromEmail(email: string): Partial<AuthUser> {
  const name = email.split("@")[0] ?? "you";
  return {
    displayName: name.charAt(0).toUpperCase() + name.slice(1),
    email,
  };
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  if (!isFirebaseConfigured) return afterAuth(demoSignIn(profileFromEmail(email)));
  const { user } = await createUserWithEmailAndPassword(fbAuth!, email, password);
  return afterAuth(toAuthUser(user));
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  if (!isFirebaseConfigured) return afterAuth(demoSignIn(profileFromEmail(email)));
  const { user } = await signInWithEmailAndPassword(fbAuth!, email, password);
  return afterAuth(toAuthUser(user));
}

/**
 * "Explore with sample data": demo user + a fully seeded world (lanes,
 * sessions, parking) so every screen has content. Seeding is idempotent.
 */
export async function signInAsDemo(): Promise<AuthUser> {
  seedDemoData({ withSamples: true });
  return afterAuth(demoSignIn());
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
export const isGoogleSignInAvailable = !isFirebaseConfigured || !!AUTH_BROKER_URL;

/** Resolves to null when the user cancels/dismisses the browser sheet. */
export async function signInWithGoogle(): Promise<AuthUser | null> {
  if (!isFirebaseConfigured) {
    return afterAuth(
      demoSignIn({ displayName: "Google User", email: "you@gmail.com" }),
    );
  }
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
  const { user } = await signInWithCustomToken(fbAuth!, token);
  return afterAuth(toAuthUser(user));
}

export async function signOutEverywhere(): Promise<void> {
  if (!isFirebaseConfigured) {
    signOutDemo();
    return;
  }
  await signOut(fbAuth!);
}

export function onAuthChanged(
  cb: (user: AuthUser | null) => void,
): () => void {
  if (!isFirebaseConfigured) return onAuthChangedDemo(cb);
  return onAuthStateChanged(fbAuth!, (u) => cb(u ? toAuthUser(u) : null));
}
