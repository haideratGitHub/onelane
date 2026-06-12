import { useState } from "react";
import { View, Text, Pressable, Alert, ScrollView } from "react-native";
import { router, Redirect } from "expo-router";
import {
  Screen,
  ScreenScroll,
  Heading,
  Muted,
  Button,
  Field,
  Label,
  Card,
} from "@/src/components/ui";
import { useApp } from "@/src/store/useApp";
import { useElapsed } from "@/src/hooks/useElapsed";
import { hasOverrun, isPaused } from "@/src/domain";
import { formatDuration } from "@/src/utils/format";

export default function SessionScreen() {
  const activeSession = useApp((s) => s.activeSession);
  const domainById = useApp((s) => s.domainById);
  const pauseActive = useApp((s) => s.pauseActive);
  const resumeActive = useApp((s) => s.resumeActive);
  const completeActive = useApp((s) => s.completeActive);
  const abandonActive = useApp((s) => s.abandonActive);

  const [closing, setClosing] = useState(false);
  const [note, setNote] = useState("");

  const elapsed = useElapsed(activeSession);

  // Session ended elsewhere (or never existed) → back to Today.
  if (!activeSession) return <Redirect href="/" />;

  const domain = domainById(activeSession.domainId);
  const paused = isPaused(activeSession);
  const overrun = hasOverrun(activeSession, Date.now());

  function confirmAbandon() {
    Alert.alert(
      "Leave the lane?",
      "This block will be marked abandoned. No penalty — progress over perfection.",
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            await abandonActive();
            router.replace("/");
          },
        },
      ],
    );
  }

  async function onComplete() {
    await completeActive(note);
    router.replace("/");
  }

  if (closing) {
    return (
      <Screen>
        <ScreenScroll contentContainerClassName="px-5 pb-10 pt-4">
          <Heading>What got done?</Heading>
          <Muted>One line. This is your record — closure for the block.</Muted>
          <View className="mt-5">
            <Field
              placeholder="e.g. Shipped onboarding; 2 bugs left for tomorrow"
              value={note}
              onChangeText={setNote}
              autoFocus
              multiline
            />
          </View>
          <View className="mt-6 gap-3">
            <Button title="Close the block" onPress={onComplete} />
            <Button title="Back" variant="ghost" onPress={() => setClosing(false)} />
          </View>
        </ScreenScroll>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-5 pb-10 pt-4">
        {/* Pinned objective — the anti-yak-shave anchor */}
        <Label>{domain?.icon} {domain?.name} · staying in this lane</Label>
        <Card>
          <Text className="text-xs uppercase tracking-wider text-fog">
            The one outcome
          </Text>
          <Text className="mt-1 text-xl font-semibold text-white">
            {activeSession.intendedOutcome}
          </Text>
        </Card>

        {overrun ? (
          <View className="mt-3 rounded-xl border border-line/40 bg-line/10 p-3">
            <Text className="text-sm text-line">
              Still working toward this? If you've drifted into a side-quest, park
              it and come back — or close the block.
            </Text>
          </View>
        ) : null}

        {/* Timer */}
        <View className="my-10 items-center">
          <Text className="text-6xl font-bold tabular-nums text-white">
            {formatDuration(elapsed)}
          </Text>
          <Text className="mt-2 text-sm text-fog">
            {paused ? "Paused" : "Focused"}
            {activeSession.plannedDurationMin
              ? ` · planned ${activeSession.plannedDurationMin} min`
              : ""}
          </Text>
        </View>

        <View className="gap-3">
          {paused ? (
            <Button title="Resume" onPress={resumeActive} />
          ) : (
            <Button title="Pause" variant="ghost" onPress={pauseActive} />
          )}

          <Button
            title="＋ Park a thought"
            variant="ghost"
            onPress={() => router.push("/capture")}
          />

          <Button title="End block" onPress={() => setClosing(true)} />

          <Pressable onPress={confirmAbandon} className="items-center py-2">
            <Text className="text-sm text-fog">Leave the lane</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
