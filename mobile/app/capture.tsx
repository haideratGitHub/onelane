import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Screen, Heading, Muted, Button, Field } from "@/src/components/ui";
import { useApp } from "@/src/store/useApp";

/**
 * The 5-second parking lot. Capture the off-task impulse and get straight back to
 * the lane — honored without being obeyed.
 */
export default function Capture() {
  const parkDistraction = useApp((s) => s.parkDistraction);
  const [text, setText] = useState("");

  async function onSave() {
    const value = text.trim();
    if (value) await parkDistraction(value);
    router.back();
  }

  return (
    <Screen>
      <View className="flex-1 px-5 pt-4">
        <Heading>Park it</Heading>
        <Muted>Get it out of your head. You'll triage it later — not now.</Muted>
        <View className="mt-5">
          <Field
            placeholder="The thing that just pulled at you…"
            value={text}
            onChangeText={setText}
            autoFocus
            multiline
            onSubmitEditing={onSave}
          />
        </View>
        <View className="mt-6 gap-3">
          <Button title="Park & return" onPress={onSave} disabled={!text.trim()} />
          <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
        </View>
      </View>
    </Screen>
  );
}
