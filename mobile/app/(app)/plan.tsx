import { View, Text, Pressable, ScrollView } from "react-native";
import { Screen, Heading, Muted, Card, Label, Button } from "@/src/components/ui";
import { useApp } from "@/src/store/useApp";
import { formatHours } from "@/src/utils/format";
import { signOutEverywhere } from "@/src/firebase/auth";

export default function Plan() {
  const domains = useApp((s) => s.domains);
  const setDomainTarget = useApp((s) => s.setDomainTarget);

  const total = domains.reduce((sum, d) => sum + d.weeklyTargetHours, 0);
  // Gentle right-sizing nudge — the brief's ~81h plan should be questioned, not executed blindly.
  const overloaded = total > 60;

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-5 pb-12 pt-2">
        <Heading>Your week</Heading>
        <Muted>Flexible hour budgets per lane — not rigid clock blocks.</Muted>

        <View className="mt-5">
          <Card className={overloaded ? "border-line/40" : ""}>
            <View className="flex-row items-center justify-between">
              <Text className="text-fog">Total planned</Text>
              <Text className="text-2xl font-bold text-white">
                {formatHours(total)}<Text className="text-base text-fog"> / week</Text>
              </Text>
            </View>
            {overloaded ? (
              <Text className="mt-2 text-sm text-line">
                That's an ambitious load. Sustainable beats maximal — consider where
                you can right-size so 70% is realistic.
              </Text>
            ) : (
              <Text className="mt-2 text-sm text-fog">
                Hitting 70% of this counts as a winning week.
              </Text>
            )}
          </Card>
        </View>

        <View className="mt-6">
          <Label>Lanes</Label>
          {domains.map((d) => (
            <Card key={d.id} className="mb-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                  <Text className="text-base font-semibold text-white">
                    {d.icon} {d.name}
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Stepper
                    label="−"
                    onPress={() => setDomainTarget(d.id, d.weeklyTargetHours - 1)}
                  />
                  <Text className="w-12 text-center text-lg font-bold tabular-nums text-white">
                    {formatHours(d.weeklyTargetHours)}
                  </Text>
                  <Stepper
                    label="＋"
                    onPress={() => setDomainTarget(d.id, d.weeklyTargetHours + 1)}
                  />
                </View>
              </View>
            </Card>
          ))}
        </View>

        <View className="mt-8">
          <Button
            title="Sign out"
            variant="ghost"
            onPress={() => signOutEverywhere()}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Stepper({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="h-9 w-9 items-center justify-center rounded-lg border border-white/15"
    >
      <Text className="text-lg text-white">{label}</Text>
    </Pressable>
  );
}
