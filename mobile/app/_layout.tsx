import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useAuth, useAuthListener } from "@/src/store/useAuth";
import { setupNotifications } from "@/src/notifications/notifications";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useAuthListener();
  const initializing = useAuth((s) => s.initializing);

  useEffect(() => {
    setupNotifications().catch(() => {});
  }, []);

  useEffect(() => {
    if (!initializing) SplashScreen.hideAsync().catch(() => {});
  }, [initializing]);

  if (initializing) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#0B0F14" },
          }}
        >
          <Stack.Screen name="session/start" options={{ presentation: "modal" }} />
          <Stack.Screen name="capture" options={{ presentation: "modal" }} />
          <Stack.Screen name="lane/[id]/index" options={{ presentation: "modal" }} />
          <Stack.Screen name="lane/[id]/history" options={{ presentation: "modal" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
