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

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  if (!isFirebaseConfigured) throw new Error("Firebase is not configured — set EXPO_PUBLIC_FIREBASE_* in .env (see .env.example) or use demo mode.");
  const { user } = await createUserWithEmailAndPassword(fbAuth!, email, password);
  return afterAuth(toAuthUser(user));
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  if (!isFirebaseConfigured) throw new Error("Firebase is not configured — set EXPO_PUBLIC_FIREBASE_* in .env (see .env.example) or use demo mode.");
  const { user } = await signInWithEmailAndPassword(fbAuth!, email, password);
  return afterAuth(toAuthUser(user));
}

/** Demo mode: fake local user + in-memory data (see demo.ts). No Firebase needed. */
export async function signInAsDemo(): Promise<AuthUser> {
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
