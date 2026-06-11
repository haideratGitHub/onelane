import type { ExpoConfig } from "expo/config";

/**
 * onelane Expo config.
 *
 * Native modules in use (Google Sign-In, React Native Firebase) mean this app
 * must run from a **custom dev build** (`expo run:ios` / EAS dev build), not Expo
 * Go. Drop your Firebase `google-services.json` / `GoogleService-Info.plist` into
 * this folder (gitignored) before building, and set the env vars in `.env`.
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
    googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? "./GoogleService-Info.plist",
  },
  android: {
    package: "com.onelane.app",
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
  },
  plugins: [
    "expo-router",
    "@react-native-firebase/app",
    "@react-native-firebase/auth",
    [
      "expo-build-properties",
      {
        ios: { useFrameworks: "static" },
      },
    ],
    [
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme:
          process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME ??
          "com.googleusercontent.apps.PLACEHOLDER",
      },
    ],
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
  extra: {
    // Web client ID from Firebase console → used by Google Sign-In to mint the
    // idToken we exchange for a Firebase credential.
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? null,
  },
};

export default config;
