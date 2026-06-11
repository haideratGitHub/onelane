import { initializeApp, getApp, getApps } from "firebase/app";
import { initializeAuth, getAuth, type Auth } from "firebase/auth";
// getReactNativePersistence only exists in firebase/auth's React Native build, so
// the default (browser) types don't declare it — Metro resolves the RN build at
// runtime. The @ts-ignore silences that editor/tsc false-positive.
// @ts-ignore
import { getReactNativePersistence } from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  type Firestore,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { firebaseConfig, isFirebaseConfigured } from "./config";

/**
 * Pure-JS Firebase SDK init (interim, so the app runs in Expo Go — no native
 * modules). Initialization is **conditional**: with no EXPO_PUBLIC_FIREBASE_* env
 * the exports are null and the app runs in demo mode (see config.ts / demo.ts)
 * instead of crashing at module load with auth/invalid-api-key.
 *
 * `initializeAuth`/`initializeFirestore` may run only once per app; on Fast
 * Refresh this module re-evaluates, so each falls back to its getter. AsyncStorage
 * persistence keeps the user signed in across reloads/relaunches. Long polling is
 * forced because Firestore's WebChannel streaming is unreliable under React
 * Native / Expo Go (onSnapshot can stall without it); note the JS SDK has no
 * on-disk persistence on RN — in-memory cache only.
 */
const app = isFirebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const fbAuth: Auth | null = app
  ? (() => {
      try {
        return initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } catch {
        return getAuth(app);
      }
    })()
  : null;

export const db: Firestore | null = app
  ? (() => {
      try {
        return initializeFirestore(app, { experimentalForceLongPolling: true });
      } catch {
        return getFirestore(app);
      }
    })()
  : null;
