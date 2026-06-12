import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import {
  Screen,
  ScreenScroll,
  Heading,
  Muted,
  Button,
  Field,
  Label,
} from "@/src/components/ui";
import { useApp } from "@/src/store/useApp";
import { DEFAULT_BLOCK_MINUTES } from "@/src/domain";

const DURATIONS = [30, 60, 90];
const MAX_CUSTOM_MINUTES = 240;

export default function StartSession() {
  const domains = useApp((s) => s.domains);
  const startSession = useApp((s) => s.startSession);

  const [domainId, setDomainId] = useState<string | null>(domains[0]?.id ?? null);
  const [outcome, setOutcome] = useState("");
  const [minutes, setMinutes] = useState<number>(DEFAULT_BLOCK_MINUTES);
  const [custom, setCustom] = useState(false);
  const [customText, setCustomText] = useState("");
  const [busy, setBusy] = useState(false);

  // While in custom mode the effective minutes come from the text field.
  const customMinutes = parseInt(customText, 10);
  const customValid =
    Number.isFinite(customMinutes) &&
    customMinutes >= 5 &&
    customMinutes <= MAX_CUSTOM_MINUTES;
  const effectiveMinutes = custom ? (customValid ? customMinutes : null) : minutes;

  const canStart =
    !!domainId && outcome.trim().length > 0 && effectiveMinutes !== null && !busy;

  async function onStart() {
    if (!domainId || effectiveMinutes === null) return;
    setBusy(true);
    await startSession({
      domainId,
      intendedOutcome: outcome,
      plannedDurationMin: effectiveMinutes,
    });
    const id = useApp.getState().activeSession?.id;
    if (id) router.replace(`/session/${id}`);
    else router.back();
  }

  return (
    <Screen>
      <ScreenScroll contentContainerClassName="px-5 pb-10 pt-3">
        <Heading>Start a focus session</Heading>
        <Muted>One lane, one outcome. Stay there until it's done.</Muted>

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
          <View className="flex-row flex-wrap gap-2">
            {DURATIONS.map((m) => {
              const selected = !custom && m === minutes;
              return (
                <Pressable
                  key={m}
                  onPress={() => {
                    setCustom(false);
                    setMinutes(m);
                  }}
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
            <Pressable
              onPress={() => setCustom(true)}
              className="rounded-xl border px-4 py-2"
              style={{
                borderColor: custom ? "#FACC15" : "rgba(255,255,255,0.12)",
                backgroundColor: custom ? "#FACC1522" : "transparent",
              }}
            >
              <Text
                className="text-sm font-medium"
                style={{ color: custom ? "#FACC15" : "#9AA7B6" }}
              >
                Custom
              </Text>
            </Pressable>
          </View>
          {custom && (
            <View className="mt-3">
              <Field
                placeholder={`Minutes (5–${MAX_CUSTOM_MINUTES})`}
                value={customText}
                onChangeText={(t) => setCustomText(t.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                maxLength={3}
                autoFocus
              />
              {customText.length > 0 && !customValid && (
                <View className="mt-2">
                  <Muted>
                    Pick between 5 and {MAX_CUSTOM_MINUTES} minutes.
                  </Muted>
                </View>
              )}
            </View>
          )}
        </View>

        <View className="mt-8 gap-3">
          <Button title="Start" onPress={onStart} disabled={!canStart} />
          <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
        </View>
      </ScreenScroll>
    </Screen>
  );
}
