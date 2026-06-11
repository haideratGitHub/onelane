import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

/**
 * React Native Firebase auto-initialises from the native config files
 * (google-services.json / GoogleService-Info.plist) at app launch, so there's no
 * explicit initializeApp() here. We just re-export the module instances.
 */
export const db = firestore();
export const fbAuth = auth();

/** Firestore offline persistence is on by default in RN Firebase. */
db.settings({ persistence: true }).catch(() => {
  /* settings can only be set once; ignore on hot reload */
});
