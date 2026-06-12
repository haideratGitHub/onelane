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
import { bootstrapDomains, ensureUserDoc } from "./repositories";

export { isFirebaseConfigured } from "./config";

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
 * mode instead. Every entry point bootstraps the user's doc + default lanes
 * (idempotent).
 */
async function afterAuth(user: AuthUser): Promise<AuthUser> {
  await ensureUserDoc(user.uid, {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  });
  await bootstrapDomains(user.uid);
  return user;
}

/**
 * Demo fallback for the real onboarding form: with no Firebase config, any
 * credentials sign in a local fake account named after the email, so the full
 * sign-in/sign-up flow is walkable. Routing through afterAuth keeps the
 * default-lanes bootstrap on the path (clean first-run — no sample content).
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
 * "Explore with sample data": demo user + a fully seeded world (sessions,
 * parking) so every screen has content. Seeding here is idempotent, so the
 * bootstrapDomains call inside afterAuth becomes a no-op.
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
