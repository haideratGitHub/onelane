import type { ExpoConfig } from "expo/config";

/**
 * onelane Expo config.
 *
 * Interim setup: the app uses the **pure-JS Firebase SDK** (no native modules), so
 * it runs in **Expo Go** — `npm run start` then scan the QR. Firebase is configured
 * at runtime from EXPO_PUBLIC_FIREBASE_* env vars (see `.env.example`), not via a
 * native config file. Google Sign-In (native) is deferred to a future dev build.
 */
const config: ExpoConfig = {
  name: "onelane",
  slug: "onelane",
  scheme: "onelane",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  splash: {
    backgroundColor: "#0B0F14",
    resizeMode: "contain",
  },
  ios: {
    bundleIdentifier: "com.onelane.app",
    supportsTablet: true,
  },
  android: {
    package: "com.onelane.app",
  },
  plugins: [
    "expo-router",
    [
      "expo-notifications",
      {
        color: "#FACC15",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
