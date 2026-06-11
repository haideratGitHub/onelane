import { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Screen,
  Heading,
  Muted,
  Button,
  Field,
  Label,
} from "@/src/components/ui";
import { useApp } from "@/src/store/useApp";
import { LANE_ICONS, LANE_PALETTE, laneColor } from "@/src/theme";
import { formatHours } from "@/src/utils/format";

/**
 * Lane editor — create (`/lane/new`) or edit/archive an existing lane.
 * Root-level modal (like session/*) so it presents over the tabs and the
 * listeners in (app)/_layout stay mounted beneath it.
 */
export default function LaneEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";

  const domainsAll = useApp((s) => s.domainsAll);
  const addDomain = useApp((s) => s.addDomain);
  const editDomain = useApp((s) => s.editDomain);
  const archiveDomain = useApp((s) => s.archiveDomain);
  const loggedHoursFor = useApp((s) => s.loggedHoursFor);

  const existing = isNew ? undefined : domainsAll.find((d) => d.id === id);

  // Defaults for a new lane: next palette color, first icon not already in use.
  const usedIcons = new Set(domainsAll.map((d) => d.icon));
  const [name, setName] = useState(existing?.name ?? "");
  const [icon, setIcon] = useState(
    existing?.icon ?? LANE_ICONS.find((i) => !usedIcons.has(i)) ?? LANE_ICONS[0],
  );
  const [color, setColor] = useState(
    existing?.color ?? laneColor(domainsAll.length),
  );
  const [hours, setHours] = useState(existing?.weeklyTargetHours ?? 5);
  const [busy, setBusy] = useState(false);

  const canSave = name.trim().length > 0 && !busy;

  async function onSave() {
    setBusy(true);
    try {
      if (isNew) {
        await addDomain({ name: name.trim(), icon, color, weeklyTargetHours: hours });
      } else if (existing) {
        await editDomain(existing.id, {
          name: name.trim(),
          icon,
          color,
          weeklyTargetHours: hours,
        });
      }
      router.back();
    } finally {
      setBusy(false);
    }
  }

  function onArchive() {
    if (!existing) return;
    const logged = loggedHoursFor(existing.id);
    const history =
      logged > 0
        ? ` You've logged ${formatHours(logged)} here this week — it stays in this week's review as history.`
        : "";
    Alert.alert(
      "Archive this lane?",
      `It disappears from your plan and pickers, but past sessions are kept.${history}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            const res = await archiveDomain(existing.id);
            if (!res.ok && res.reason === "active-session") {
              Alert.alert(
                "Lane is in use",
                "Finish or leave the current focus block first.",
              );
              return;
            }
            router.back();
          },
        },
      ],
    );
  }

  if (!isNew && !existing) {
    // Lane was archived/removed while the modal was open.
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-6">
          <Muted>This lane no longer exists.</Muted>
          <View className="mt-4 w-full">
            <Button title="Close" variant="ghost" onPress={() => router.back()} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-5 pb-10 pt-3">
        <Heading>{isNew ? "New lane" : "Edit lane"}</Heading>
        <Muted>
          {isNew
            ? "A lane is one life domain you protect time for."
            : "Rename, restyle, or right-size this lane."}
        </Muted>

        <View className="mt-6">
          <Label>Name</Label>
          <Field
            placeholder="e.g. Writing"
            value={name}
            onChangeText={setName}
            autoFocus={isNew}
            autoCapitalize="words"
          />
        </View>

        <View className="mt-6">
          <Label>Icon</Label>
          <View className="flex-row flex-wrap gap-2">
            {LANE_ICONS.map((i) => {
              const selected = i === icon;
              return (
                <Pressable
                  key={i}
                  onPress={() => setIcon(i)}
                  className="h-11 w-11 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: selected ? color : "rgba(255,255,255,0.12)",
                    backgroundColor: selected ? `${color}22` : "transparent",
                  }}
                >
                  <Text className="text-lg">{i}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-6">
          <Label>Color</Label>
          <View className="flex-row flex-wrap gap-3">
            {LANE_PALETTE.map((c) => {
              const selected = c === color;
              return (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  className="h-9 w-9 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: c,
                    borderWidth: selected ? 3 : 0,
                    borderColor: "#FFFFFF",
                  }}
                />
              );
            })}
          </View>
        </View>

        <View className="mt-6">
          <Label>Weekly target</Label>
          <View className="flex-row items-center gap-4">
            <Pressable
              onPress={() => setHours((h) => Math.max(0, h - 1))}
              className="h-11 w-11 items-center justify-center rounded-lg border border-white/15"
            >
              <Text className="text-xl text-white">−</Text>
            </Pressable>
            <Text className="w-16 text-center text-2xl font-bold tabular-nums text-white">
              {formatHours(hours)}
            </Text>
            <Pressable
              onPress={() => setHours((h) => h + 1)}
              className="h-11 w-11 items-center justify-center rounded-lg border border-white/15"
            >
              <Text className="text-xl text-white">＋</Text>
            </Pressable>
            <Muted>per week</Muted>
          </View>
        </View>

        <View className="mt-8 gap-3">
          <Button
            title={busy ? "Saving…" : isNew ? "Create lane" : "Save changes"}
            onPress={onSave}
            disabled={!canSave}
          />
          <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
          {!isNew && (
            <Button title="Archive lane" variant="danger" onPress={onArchive} />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
