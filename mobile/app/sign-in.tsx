import { useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import {
  Screen,
  Button,
  Heading,
  Muted,
  Field,
  Label,
  PasswordField,
} from "@/src/components/ui";
import {
  isFirebaseConfigured,
  isGoogleSignInAvailable,
  signInAsDemo,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/src/firebase/auth";

// Flushes any pending auth browser session (recommended by expo-web-browser).
WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const isSignup = mode === "signup";

  async function onSubmit() {
    Keyboard.dismiss();
    if (!email.trim() || !password) {
      Alert.alert("Missing details", "Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      if (isSignup) {
        await signUpWithEmail(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
      router.replace("/");
    } catch (e) {
      Alert.alert(
        isSignup ? "Sign-up failed" : "Sign-in failed",
        e instanceof Error ? e.message : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    Keyboard.dismiss();
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) router.replace("/");
    } catch (e) {
      Alert.alert(
        "Google sign-in failed",
        e instanceof Error ? e.message : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function onDemo() {
    setLoading(true);
    try {
      await signInAsDemo();
      router.replace("/");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingVertical: 32,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-3 flex-row items-center gap-2">
            <View className="h-7 w-7 items-center justify-center rounded-md bg-line">
              <View className="h-3.5 w-[3px] rounded-full bg-ink" />
            </View>
            <Text className="text-lg font-semibold text-white">onelane</Text>
          </View>

          <Heading>Stay in one lane.</Heading>
          <View className="mt-3 max-w-sm">
            <Muted>
              Protect single-tasking. Capture distractions without chasing them. End
              the week knowing exactly what you did.
            </Muted>
          </View>

          <View className="mt-10 gap-4">
            {!isFirebaseConfigured && (
              <View className="rounded-lg border border-line/30 bg-line/10 px-3 py-2">
                <Text className="text-xs text-line">
                  Demo mode — any email and password works. Your account stays on
                  this device and resets on reload.
                </Text>
              </View>
            )}

            <View>
              <Label>Email</Label>
              <Field
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordRef.current?.focus()}
                editable={!loading}
              />
            </View>
            <View>
              <Label>Password</Label>
              <PasswordField
                ref={passwordRef}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                autoCapitalize="none"
                autoComplete={isSignup ? "new-password" : "password"}
                returnKeyType="go"
                onSubmitEditing={onSubmit}
                editable={!loading}
              />
            </View>

            <Button
              title={
                loading
                  ? isSignup
                    ? "Creating account…"
                    : "Signing in…"
                  : isSignup
                    ? "Create account"
                    : "Sign in"
              }
              onPress={onSubmit}
              disabled={loading}
            />
            <Button
              title={
                isSignup
                  ? "Have an account? Sign in"
                  : "New here? Create an account"
              }
              variant="ghost"
              onPress={() => setMode(isSignup ? "signin" : "signup")}
              disabled={loading}
            />

            {isGoogleSignInAvailable && (
              <>
                <View className="my-1 flex-row items-center gap-3">
                  <View className="h-px flex-1 bg-white/10" />
                  <Text className="text-xs uppercase tracking-wider text-fog">
                    or
                  </Text>
                  <View className="h-px flex-1 bg-white/10" />
                </View>
                <Pressable
                  onPress={onGoogle}
                  disabled={loading}
                  className={`flex-row items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3.5 ${
                    loading ? "opacity-50" : ""
                  }`}
                >
                  <Ionicons name="logo-google" size={18} color="#FFFFFF" />
                  <Text className="font-semibold text-white">
                    Continue with Google
                  </Text>
                </Pressable>
              </>
            )}

            {!isFirebaseConfigured && (
              <Button
                title="Skip — explore with sample data"
                variant="ghost"
                onPress={onDemo}
                disabled={loading}
              />
            )}
            <Muted>
              We only use your account to sync your lanes across devices.
            </Muted>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
