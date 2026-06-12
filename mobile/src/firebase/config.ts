import type { FirebaseOptions } from "firebase/app";

/**
 * Firebase Web config from EXPO_PUBLIC_FIREBASE_* env vars (see .env.example).
 * Firebase is **required** — the env must be present (firebase.ts asserts it at
 * startup with a clear error). Set it up before running: copy `.env.example` to
 * `.env` and fill these in (see docs/auth.md).
 */
export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** True when the env provides enough config to actually reach Firebase. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);
