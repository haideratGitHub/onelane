import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Screen,
  ScreenScroll,
  Heading,
  Muted,
  Card,
  Button,
  Label,
} from "@/src/components/ui";
import { useApp } from "@/src/store/useApp";
import { elapsedMs, type Session } from "@/src/domain";
import { formatDuration, formatHours } from "@/src/utils/format";

/**
 * Lane history — every finished block ever logged in one lane, newest first.
 * Opened by tapping a lane on Today or "View session history" in the editor.
 * One-shot fetch (fetchLaneHistory): history doesn't need a live listener.
 */
export default function LaneHistory() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const domainById = useApp((s) => s.domainById);
  const fetchLaneHistory = useApp((s) => s.fetchLaneHistory);

  const lane = id ? domainById(id) : undefined;
  // null = still loading; [] = loaded, no blocks yet.
  const [blocks, setBlocks] = useState<Session[] | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    fetchLaneHistory(id).then((s) => {
      if (alive) setBlocks(s);
    });
    return () => {
      alive = false;
    };
  }, [id, fetchLaneHistory]);

  if (!lane) {
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

  const totalMs =
    blocks?.reduce((sum, s) => sum + elapsedMs(s, s.endAt ?? Date.now()), 0) ?? 0;

  return (
    <Screen>
      <ScreenScroll contentContainerClassName="px-5 pb-10 pt-3">
        <Heading>
          {lane.icon} {lane.name}
        </Heading>
        <Muted>Every block you've logged in this lane.</Muted>

        <View className="mt-5">
          <Card>
            <View className="flex-row">
              <View className="flex-1">
                <Label>Blocks</Label>
                <Text className="text-2xl font-bold tabular-nums text-white">
                  {blocks?.length ?? "—"}
                </Text>
              </View>
              <View className="flex-1">
                <Label>Time in lane</Label>
                <Text className="text-2xl font-bold tabular-nums text-white">
                  {blocks ? formatHours(totalMs / 3_600_000) : "—"}
                </Text>
              </View>
              <View className="flex-1">
                <Label>Target</Label>
                <Text className="text-2xl font-bold tabular-nums text-white">
                  {formatHours(lane.weeklyTargetHours)}
                  <Text className="text-base text-fog">/wk</Text>
                </Text>
              </View>
            </View>
          </Card>
        </View>

        <View className="mt-6">
          <Label>History</Label>
          <Card>
            {blocks === null ? (
              <View className="items-center py-6">
                <ActivityIndicator color={lane.color} />
              </View>
            ) : blocks.length === 0 ? (
              <Muted>
                No blocks here yet. Start a focus session in this lane and it
                will show up right here.
              </Muted>
            ) : (
              blocks.map((s, i) => (
                <HistoryRow key={s.id} session={s} first={i === 0} />
              ))
            )}
          </Card>
        </View>

        <View className="mt-6">
          <Button title="Close" variant="ghost" onPress={() => router.back()} />
        </View>
      </ScreenScroll>
    </Screen>
  );
}

function HistoryRow({ session, first }: { session: Session; first: boolean }) {
  const start = new Date(session.startAt);
  const day = start.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = start.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const duration = formatDuration(elapsedMs(session, session.endAt ?? Date.now()));

  return (
    <View className={first ? "" : "mt-3 border-t border-white/5 pt-3"}>
      <View className="flex-row items-start justify-between gap-3">
        <Text
          className="flex-1 text-[15px] font-medium text-white"
          numberOfLines={2}
        >
          {session.intendedOutcome}
        </Text>
        <Text className="text-sm font-semibold tabular-nums text-line">
          {duration}
        </Text>
      </View>
      <Text className="mt-1 text-xs text-fog">
        {day} · {time}
        {session.status === "abandoned" ? " · left early" : ""}
      </Text>
      {session.closureNote ? (
        <Text className="mt-1 text-sm italic text-fog">
          "{session.closureNote}"
        </Text>
      ) : null}
    </View>
  );
}
