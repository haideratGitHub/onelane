import { createHmac, timingSafeEqual } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

/**
 * Google Sign-In broker for the mobile app (see docs/auth.md).
 *
 * The Expo Go app can't receive a Google OAuth redirect (Google rejects exp://
 * URIs), so this server is the redirect target instead: it runs the OAuth
 * code flow against Google, mints a Firebase **custom token** with the Admin
 * SDK, and deep-links the token back into the app, which signs in with
 * `signInWithCustomToken`. Routes: app/api/auth/google/{start,callback}.
 *
 * Env (see web/.env.example): GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET,
 * FIREBASE_SERVICE_ACCOUNT, optional AUTH_BROKER_ORIGIN.
 */

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name} — see web/.env.example`);
  return value;
}

// Where the browser may be sent back to after sign-in: Expo Go dev URLs (exp://)
// and the app's own scheme (app.config.ts `scheme: "onelane"`). Never http(s) —
// the redirect carries a sign-in token.
const ALLOWED_RETURN_SCHEMES = new Set(["exp:", "exps:", "onelane:"]);

export function isAllowedReturnUrl(url: string): boolean {
  try {
    return ALLOWED_RETURN_SCHEMES.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

/** This deployment's public origin, for building the OAuth redirect_uri. */
export function brokerOrigin(req: Request): string {
  const fromEnv = process.env.AUTH_BROKER_ORIGIN;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto =
    req.headers.get("x-forwarded-proto") ??
    (/^(localhost|127\.)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}

// --- OAuth `state`: carries the app's return URL through the Google round-trip,
// HMAC-signed (keyed off the client secret) so the callback can trust it
// (CSRF / open-redirect guard). Expires after 10 minutes.

const STATE_MAX_AGE_MS = 10 * 60 * 1000;

function stateSecret(): string {
  return process.env.AUTH_STATE_SECRET ?? requiredEnv("GOOGLE_OAUTH_CLIENT_SECRET");
}

function hmac(data: string): string {
  return createHmac("sha256", stateSecret()).update(data).digest("base64url");
}

export function signState(returnUrl: string): string {
  const data = Buffer.from(JSON.stringify({ r: returnUrl, t: Date.now() })).toString(
    "base64url",
  );
  return `${data}.${hmac(data)}`;
}

/** Returns the embedded return URL, or null if the state is invalid/expired. */
export function verifyState(state: string): string | null {
  const [data, sig] = state.split(".");
  if (!data || !sig) return null;
  const expected = Buffer.from(hmac(data));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }
  try {
    const { r, t } = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (typeof r !== "string" || typeof t !== "number") return null;
    if (Date.now() - t > STATE_MAX_AGE_MS) return null;
    return isAllowedReturnUrl(r) ? r : null;
  } catch {
    return null;
  }
}

// --- Firebase Admin (lazy: only initialized when the callback runs)

export function adminAuth(): Auth {
  if (!getApps().length) {
    const raw = requiredEnv("FIREBASE_SERVICE_ACCOUNT").trim();
    const json = raw.startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf8");
    initializeApp({ credential: cert(JSON.parse(json)) });
  }
  return getAuth();
}

export interface GoogleProfile {
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Find-or-create the Firebase Auth user for a verified Google identity, keyed by
 * email — so someone who already has an email/password account signs into the
 * same account (same uid, same Firestore data) when they switch to Google.
 */
export async function upsertFirebaseUser(profile: GoogleProfile): Promise<string> {
  const auth = adminAuth();
  try {
    const existing = await auth.getUserByEmail(profile.email);
    if (!existing.displayName && profile.name) {
      await auth.updateUser(existing.uid, {
        displayName: profile.name,
        photoURL: profile.picture,
      });
    }
    return existing.uid;
  } catch (e) {
    if ((e as { code?: string }).code !== "auth/user-not-found") throw e;
    const created = await auth.createUser({
      email: profile.email,
      emailVerified: true,
      displayName: profile.name,
      photoURL: profile.picture,
    });
    return created.uid;
  }
}
