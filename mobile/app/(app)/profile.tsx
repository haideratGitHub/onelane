import { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { Screen, Heading, Muted, Card, Label, Button } from "@/src/components/ui";
import { useAuth } from "@/src/store/useAuth";
import { useApp } from "@/src/store/useApp";
import {
  deleteAccount,
  friendlyAuthError,
  signOutEverywhere,
} from "@/src/firebase/auth";
import { clearAllNotifications } from "@/src/notifications/notifications";

/** Minutes-from-midnight → "HH:00" (settings store whole hours via steppers). */
function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  return `${String(h).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

const DAY_MIN = 24 * 60;

export default function Profile() {
  const user = useAuth((s) => s.user);
  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);

  const initial = (user?.displayName ?? user?.email ?? "?")
    .charAt(0)
    .toUpperCase();

  const [deleting, setDeleting] = useState(false);

  function shiftQuietHour(edge: "start" | "end", deltaMin: number) {
    const next = (settings.quietHours[edge] + deltaMin + DAY_MIN) % DAY_MIN;
    // Always write quietHours as a whole object so the stored map stays complete.
    void updateSettings({ quietHours: { ...settings.quietHours, [edge]: next } });
  }

  function onSignOut() {
    Alert.alert("Sign out?", "You can sign back in anytime.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => void signOutEverywhere() },
    ]);
  }

  async function runDeleteAccount() {
    setDeleting(true);
    try {
      await deleteAccount();
      // Account + data are gone; clean up anything still scheduled locally.
      // onAuthChanged fires with null → the (app) gate redirects to /sign-in.
      await clearAllNotifications().catch(() => {});
    } catch (e) {
      Alert.alert("Couldn't delete your account", friendlyAuthError(e));
    } finally {
      setDeleting(false);
    }
  }

  function onDeleteAccount() {
    Alert.alert(
      "Delete your account?",
      "This permanently deletes your account and ALL your data — every lane, session, week, and parked thought. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              "Are you absolutely sure?",
              "There is no way to get your data back after this.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete everything",
                  style: "destructive",
                  onPress: () => void runDeleteAccount(),
                },
              ],
            ),
        },
      ],
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-5 pb-12 pt-2">
        <Heading>Profile</Heading>
        <Muted>Your account and how onelane behaves.</Muted>

        <View className="mt-5">
          <Card>
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-line">
                <Text className="text-xl font-bold text-ink">{initial}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-white" numberOfLines={1}>
                  {user?.displayName ?? "You"}
                </Text>
                {user?.email ? <Muted>{user.email}</Muted> : null}
              </View>
            </View>
          </Card>
        </View>

        <View className="mt-6">
          <Label>Week starts on</Label>
          <View className="flex-row gap-2">
            <Chip
              title="Monday"
              selected={settings.weekStartsOn === 1}
              onPress={() => void updateSettings({ weekStartsOn: 1 })}
            />
            <Chip
              title="Sunday"
              selected={settings.weekStartsOn === 0}
              onPress={() => void updateSettings({ weekStartsOn: 0 })}
            />
          </View>
          <View className="mt-2">
            <Muted>Plans, reviews, and streaks roll over on this day.</Muted>
          </View>
        </View>

        <View className="mt-6">
          <Label>Check-ins during focus</Label>
          <View className="flex-row gap-2">
            {(["gentle", "standard", "off"] as const).map((style) => (
              <Chip
                key={style}
                title={style === "gentle" ? "Gentle" : style === "standard" ? "Standard" : "Off"}
                selected={settings.checkinStyle === style}
                onPress={() => void updateSettings({ checkinStyle: style })}
              />
            ))}
          </View>
          <View className="mt-2">
            <Muted>
              Standard nudges mid-block and at the block edge. Gentle skips the
              mid-block one. Off stays silent.
            </Muted>
          </View>
        </View>

        <View className="mt-6">
          <Label>Quiet hours</Label>
          <Card>
            <HourRow
              title="From"
              value={formatClock(settings.quietHours.start)}
              onMinus={() => shiftQuietHour("start", -60)}
              onPlus={() => shiftQuietHour("start", 60)}
            />
            <View className="my-3 h-px bg-white/10" />
            <HourRow
              title="Until"
              value={formatClock(settings.quietHours.end)}
              onMinus={() => shiftQuietHour("end", -60)}
              onPlus={() => shiftQuietHour("end", 60)}
            />
          </Card>
          <View className="mt-2">
            <Muted>No notifications between these times.</Muted>
          </View>
        </View>

        <View className="mt-6">
          <Label>Max check-ins per day</Label>
          <Card>
            <HourRow
              title="Limit"
              value={String(settings.maxCheckinsPerDay)}
              onMinus={() =>
                void updateSettings({
                  maxCheckinsPerDay: Math.max(0, settings.maxCheckinsPerDay - 1),
                })
              }
              onPlus={() =>
                void updateSettings({
                  maxCheckinsPerDay: settings.maxCheckinsPerDay + 1,
                })
              }
            />
          </Card>
        </View>

        <View className="mt-10">
          <Button title="Sign out" variant="ghost" onPress={onSignOut} />
        </View>

        <View className="mt-8">
          <Label>Danger zone</Label>
          <Card className="border-lane-gym/30">
            <Text className="text-sm text-fog">
              Deleting your account permanently removes your profile and every
              lane, session, week, and parked thought. This cannot be undone.
            </Text>
            <View className="mt-4">
              <Button
                title={deleting ? "Deleting…" : "Delete account"}
                variant="danger"
                onPress={onDeleteAccount}
                disabled={deleting}
              />
            </View>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Chip({
  title,
  selected,
  onPress,
}: {
  title: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full border px-4 py-2"
      style={{
        borderColor: selected ? "#FACC15" : "rgba(255,255,255,0.12)",
        backgroundColor: selected ? "#FACC1522" : "transparent",
      }}
    >
      <Text
        className="text-sm font-medium"
        style={{ color: selected ? "#FACC15" : "#9AA7B6" }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function HourRow({
  title,
  value,
  onMinus,
  onPlus,
}: {
  title: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-fog">{title}</Text>
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={onMinus}
          className="h-9 w-9 items-center justify-center rounded-lg border border-white/15"
        >
          <Text className="text-lg text-white">−</Text>
        </Pressable>
        <Text className="w-14 text-center text-lg font-bold tabular-nums text-white">
          {value}
        </Text>
        <Pressable
          onPress={onPlus}
          className="h-9 w-9 items-center justify-center rounded-lg border border-white/15"
        >
          <Text className="text-lg text-white">＋</Text>
        </Pressable>
      </View>
    </View>
  );
}
