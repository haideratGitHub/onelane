import { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { Screen, Heading, Muted, Card, Label, Field } from "@/src/components/ui";
import { LaneRow } from "@/src/components/LaneRow";
import { useApp } from "@/src/store/useApp";
import {
  summarizeWeek,
  weekHeadline,
  formatWeekRange,
  WEEKLY_REFLECTION_PROMPTS,
} from "@/src/domain";
import { formatHours } from "@/src/utils/format";

export default function Review() {
  const domains = useApp((s) => s.domains);
  const domainsAll = useApp((s) => s.domainsAll);
  const weekId = useApp((s) => s.weekId);
  const week = useApp((s) => s.week);
  const weekSessions = useApp((s) => s.weekSessions);

  const order = domains.map((d) => d.id);
  const targets: Record<string, number> = {};
  for (const d of domains) targets[d.id] = d.weeklyTargetHours;

  const summaries = summarizeWeek(targets, weekSessions, Date.now(), order);
  const head = weekHeadline(summaries);
  // Resolve against ALL lanes so an archived lane with hours logged this week
  // still shows its name/icon/color (summarizeWeek unions actuals into the rows).
  const meta = (id: string) => domainsAll.find((d) => d.id === id);

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-5 pb-12 pt-2">
        <Heading>Weekly review</Heading>
        <Muted>{formatWeekRange(weekId)}</Muted>

        {/* Headline — framed as progress, never a failing grade */}
        <View className="mt-5">
          <Card>
            <Text className="text-3xl font-bold text-white">
              {head.lanesWon}
              <Text className="text-xl text-fog"> / {head.lanesPlanned} lanes won</Text>
            </Text>
            <Text className="mt-1 text-fog">
              {formatHours(head.actualHours)} focused of {formatHours(head.plannedHours)} planned.
              {head.lanesWon > 0 ? " Real progress — not perfection." : " Every lane is a fresh start."}
            </Text>
          </Card>
        </View>

        {/* Planned vs actual per lane */}
        <View className="mt-6">
          <Label>Planned vs. actual</Label>
          <Card>
            {summaries.length === 0 ? (
              <Muted>No lanes yet — set up your plan.</Muted>
            ) : (
              summaries.map((s) => {
                const d = meta(s.domainId);
                return (
                  <LaneRow
                    key={s.domainId}
                    name={d?.name ?? s.domainId}
                    icon={d?.icon ?? "•"}
                    color={d?.color ?? "#9AA7B6"}
                    actualHours={s.actualHours}
                    targetHours={s.targetHours}
                  />
                );
              })
            )}
          </Card>
        </View>

        {/* Reflection */}
        <View className="mt-6">
          <Label>Reflect</Label>
          {WEEKLY_REFLECTION_PROMPTS.map((prompt) => (
            <ReflectionField
              key={prompt}
              prompt={prompt}
              initial={
                week?.reflections.find((r) => r.prompt === prompt)?.answer ?? ""
              }
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function ReflectionField({
  prompt,
  initial,
}: {
  prompt: string;
  initial: string;
}) {
  const saveReflection = useApp((s) => s.saveReflection);
  const [value, setValue] = useState(initial);

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm text-white">{prompt}</Text>
      <Field
        placeholder="A sentence is enough…"
        value={value}
        onChangeText={setValue}
        onBlur={() => saveReflection(prompt, value.trim())}
        multiline
      />
    </View>
  );
}
