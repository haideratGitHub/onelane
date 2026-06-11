import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { Screen, Heading, Muted, Button, Field, Label } from "@/src/components/ui";
import { useApp } from "@/src/store/useApp";
import { DEFAULT_BLOCK_MINUTES } from "@/src/domain";

const DURATIONS = [25, 50, 90];

export default function StartSession() {
  const domains = useApp((s) => s.domains);
  const startSession = useApp((s) => s.startSession);

  const [domainId, setDomainId] = useState<string | null>(domains[0]?.id ?? null);
  const [outcome, setOutcome] = useState("");
  const [minutes, setMinutes] = useState(DEFAULT_BLOCK_MINUTES);
  const [busy, setBusy] = useState(false);

  const canStart = !!domainId && outcome.trim().length > 0 && !busy;

  async function onStart() {
    if (!domainId) return;
    setBusy(true);
    await startSession({
      domainId,
      intendedOutcome: outcome,
      plannedDurationMin: minutes,
    });
    const id = useApp.getState().activeSession?.id;
    if (id) router.replace(`/session/${id}`);
    else router.back();
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-5 pb-10 pt-3">
        <Heading>Enter a lane</Heading>
        <Muted>One domain, one outcome. Stay there until it's done.</Muted>

        <View className="mt-6">
          <Label>Lane</Label>
          {domains.length === 0 && (
            <View className="mb-2">
              <Muted>No lanes yet — create one first.</Muted>
              <View className="mt-3">
                <Button
                  title="＋ Add a lane"
                  variant="ghost"
                  onPress={() => router.replace("/lane/new")}
                />
              </View>
            </View>
          )}
          <View className="flex-row flex-wrap gap-2">
            {domains.map((d) => {
              const selected = d.id === domainId;
              return (
                <Pressable
                  key={d.id}
                  onPress={() => setDomainId(d.id)}
                  className="rounded-full border px-4 py-2"
                  style={{
                    borderColor: selected ? d.color : "rgba(255,255,255,0.12)",
                    backgroundColor: selected ? `${d.color}22` : "transparent",
                  }}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{ color: selected ? d.color : "#9AA7B6" }}
                  >
                    {d.icon} {d.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-6">
          <Label>The one outcome</Label>
          <Field
            placeholder="e.g. Ship the onboarding screen"
            value={outcome}
            onChangeText={setOutcome}
            autoFocus
            multiline
          />
          <View className="mt-2">
            <Muted>This stays pinned the whole block. It's what done looks like.</Muted>
          </View>
        </View>

        <View className="mt-6">
          <Label>Block length</Label>
          <View className="flex-row gap-2">
            {DURATIONS.map((m) => {
              const selected = m === minutes;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMinutes(m)}
                  className="rounded-xl border px-4 py-2"
                  style={{
                    borderColor: selected ? "#FACC15" : "rgba(255,255,255,0.12)",
                    backgroundColor: selected ? "#FACC1522" : "transparent",
                  }}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{ color: selected ? "#FACC15" : "#9AA7B6" }}
                  >
                    {m} min
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-8 gap-3">
          <Button title="Start" onPress={onStart} disabled={!canStart} />
          <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </Screen>
  );
}
