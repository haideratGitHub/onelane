import auth, {
  type FirebaseAuthTypes,
} from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";
import { fbAuth } from "./firebase";
import { bootstrapDomains, ensureUserDoc } from "./repositories";

const webClientId =
  (Constants.expoConfig?.extra?.googleWebClientId as string | null) ?? undefined;

let configured = false;

/** Call once at startup before any sign-in attempt. */
export function configureGoogleSignIn(): void {
  if (configured) return;
  GoogleSignin.configure({ webClientId });
  configured = true;
}

/**
 * Google → Firebase sign-in. Gets a Google idToken, exchanges it for a Firebase
 * credential, then bootstraps the user's doc + default lanes on first login.
 */
export async function signInWithGoogle(): Promise<FirebaseAuthTypes.User> {
  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();
  const idToken = response.data?.idToken;
  if (!idToken) {
    throw new Error("Google sign-in returned no idToken");
  }

  const credential = auth.GoogleAuthProvider.credential(idToken);
  const { user } = await fbAuth.signInWithCredential(credential);

  await ensureUserDoc(user.uid, {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  });
  await bootstrapDomains(user.uid);

  return user;
}

export async function signOutEverywhere(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    /* not signed in with Google; ignore */
  }
  await fbAuth.signOut();
}

export function onAuthChanged(
  cb: (user: FirebaseAuthTypes.User | null) => void,
): () => void {
  return fbAuth.onAuthStateChanged(cb);
}
