import { useCallback } from "react";
import { Redirect, Tabs } from "expo-router";
import { Text, View } from "react-native";
import { useAuth } from "@/src/store/useAuth";
import { useApp, useAppSync } from "@/src/store/useApp";
import { TourOverlay } from "@/src/components/Tour";
import {
  presentSessionNotification,
  useNotificationActions,
} from "@/src/notifications/notifications";
import { colors } from "@/src/theme";

function TabGlyph({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ color, fontSize: 18 }}>{glyph}</Text>;
}

export default function AppLayout() {
  const user = useAuth((s) => s.user);
  // Wire Firestore listeners for the signed-in user (no-op while signed out).
  useAppSync(user?.uid ?? null);

  // "Park a thought" typed into the session notification (lock screen) lands
  // in the parking lot without the app ever coming to the foreground. iOS
  // dismisses an actioned notification, so re-present the card while the block
  // is still running — parking several thoughts in a row must keep working.
  const onPark = useCallback((text: string) => {
    const state = useApp.getState();
    void state.parkDistraction(text);
    const session = state.activeSession;
    if (session) {
      const name = state.domainById(session.domainId)?.name ?? "this lane";
      void presentSessionNotification(session, name).catch(() => {});
    }
  }, []);
  useNotificationActions(onPark);

  if (!user) return <Redirect href="/sign-in" />;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.asphalt,
          borderTopColor: "rgba(255,255,255,0.06)",
        },
        tabBarActiveTintColor: colors.line,
        tabBarInactiveTintColor: colors.fog,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color }) => <TabGlyph glyph="◉" color={color} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          tabBarIcon: ({ color }) => <TabGlyph glyph="▦" color={color} />,
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: "Review",
          tabBarIcon: ({ color }) => <TabGlyph glyph="▲" color={color} />,
        }}
      />
      <Tabs.Screen
        name="parking"
        options={{
          title: "Parking",
          tabBarIcon: ({ color }) => <TabGlyph glyph="⚑" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabGlyph glyph="◐" color={color} />,
        }}
      />
      </Tabs>
      {/* Spotlight tour — above the Tabs so it can highlight the tab bar too. */}
      <TourOverlay />
    </View>
  );
}
