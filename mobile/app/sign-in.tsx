import { useState } from "react";
import { View, Text, Alert } from "react-native";
import { router } from "expo-router";
import { Screen, Button, Heading, Muted } from "@/src/components/ui";
import { signInWithGoogle } from "@/src/firebase/auth";

export default function SignIn() {
  const [loading, setLoading] = useState(false);

  async function onGoogle() {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.replace("/");
    } catch (e) {
      Alert.alert(
        "Sign-in failed",
        e instanceof Error ? e.message : "Please try again.",
      );
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

        <View className="mt-10">
          <Button
            title={loading ? "Signing in…" : "Continue with Google"}
            onPress={onGoogle}
            disabled={loading}
          />
          <View className="mt-3">
            <Muted>We only use your account to sync your lanes across devices.</Muted>
          </View>
        </View>
      </View>
    </Screen>
  );
}
