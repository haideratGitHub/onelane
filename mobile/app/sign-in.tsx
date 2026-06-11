import { useState } from "react";
import { View, Text, Alert } from "react-native";
import { router } from "expo-router";
import {
  Screen,
  Button,
  Heading,
  Muted,
  Field,
  Label,
  Card,
} from "@/src/components/ui";
import {
  isFirebaseConfigured,
  signInAsDemo,
  signInWithEmail,
  signUpWithEmail,
} from "@/src/firebase/auth";

export default function SignIn() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function onSubmit() {
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
      <View className="flex-1 justify-center px-6">
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

        {isFirebaseConfigured ? (
          <View className="mt-10 gap-4">
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
                editable={!loading}
              />
            </View>
            <View>
              <Label>Password</Label>
              <Field
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                autoComplete={isSignup ? "new-password" : "password"}
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
            <Muted>We only use your account to sync your lanes across devices.</Muted>
          </View>
        ) : (
          <View className="mt-10 gap-4">
            <Card>
              <Text className="font-semibold text-white">Demo mode</Text>
              <View className="mt-1">
                <Muted>
                  Firebase isn&apos;t configured yet, so nothing is saved or synced —
                  explore with sample data. To enable real accounts, fill the
                  EXPO_PUBLIC_FIREBASE_* values in mobile/.env (see .env.example)
                  and restart.
                </Muted>
              </View>
            </Card>
            <Button
              title={loading ? "Starting…" : "Explore the demo"}
              onPress={onDemo}
              disabled={loading}
            />
          </View>
        )}
      </View>
    </Screen>
  );
}
