import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";
import { useAuth } from "@/src/store/useAuth";
import { useAppSync } from "@/src/store/useApp";
import { colors } from "@/src/theme";

function TabGlyph({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ color, fontSize: 18 }}>{glyph}</Text>;
}

export default function AppLayout() {
  const user = useAuth((s) => s.user);
  // Wire Firestore listeners for the signed-in user (no-op while signed out).
  useAppSync(user?.uid ?? null);

  if (!user) return <Redirect href="/sign-in" />;

  return (
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
  );
}
