import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
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
 * Interim auth: email/password via the Firebase JS SDK so the app runs in Expo Go
 * (Google Sign-In is a native module / needs a custom-scheme dev build — deferred).
 * With no Firebase config, the sign-in screen offers demo mode instead (below).
 * Every entry point bootstraps the user's doc + default lanes (idempotent).
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
