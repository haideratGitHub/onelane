import { View, Text, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Heading, Muted, Button, Label } from "@/src/components/ui";
import { LaneRow } from "@/src/components/LaneRow";
import { useTour, useTourTarget } from "@/src/components/Tour";
import { useApp } from "@/src/store/useApp";
import { useAuth } from "@/src/store/useAuth";
import { useElapsed } from "@/src/hooks/useElapsed";
import { actualHoursByDomain, formatWeekRange } from "@/src/domain";
import { formatDuration } from "@/src/utils/format";

export default function Today() {
  const user = useAuth((s) => s.user);
  const domains = useApp((s) => s.domains);
  const weekId = useApp((s) => s.weekId);
  const weekSessions = useApp((s) => s.weekSessions);
  const activeSession = useApp((s) => s.activeSession);
  const parking = useApp((s) => s.parking);
  const domainById = useApp((s) => s.domainById);

  const elapsed = useElapsed(activeSession);
  const actuals = actualHoursByDomain(weekSessions, Date.now());
  const activeDomain = activeSession ? domainById(activeSession.domainId) : undefined;

  // Spotlight-tour anchors (see components/Tour.tsx).
  const startTour = useTour((s) => s.start);
  const guideTarget = useTourTarget("guide");
  const startTarget = useTourTarget("start");
  const parkTarget = useTourTarget("park");
  const lanesTarget = useTourTarget("lanes");

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-5 pb-12 pt-2">
        <View className="mb-1 flex-row items-center justify-between">
          <Heading>
            {greeting()}
            {user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}
          </Heading>
          <Pressable
            ref={guideTarget}
            onPress={startTour}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Start the app tour"
            className="h-9 w-9 items-center justify-center rounded-full border border-white/15"
          >
            <Ionicons name="help" size={18} color="#9AA7B6" />
          </Pressable>
        </View>
        <Muted>This week · {formatWeekRange(weekId)}</Muted>

        {/* Active session, or the start CTA */}
        <View className="mt-5" ref={startTarget} collapsable={false}>
          {activeSession ? (
            <Pressable onPress={() => router.push(`/session/${activeSession.id}`)}>
              <Card className="border-line/30">
                <Label>In the lane</Label>
                <Text className="text-lg font-semibold text-white">
                  {activeDomain?.icon} {activeDomain?.name}
                </Text>
                <Text className="mt-1 text-fog" numberOfLines={2}>
                  {activeSession.intendedOutcome}
                </Text>
                <Text className="mt-3 text-4xl font-bold tabular-nums text-line">
                  {formatDuration(elapsed)}
                </Text>
                <Text className="mt-1 text-xs text-fog">Tap to open the session</Text>
              </Card>
            </Pressable>
          ) : (
            <Card>
              <Label>Single-task</Label>
              <Text className="text-lg font-semibold text-white">
                Pick one lane and stay in it.
              </Text>
              <View className="mt-4">
                <Button
                  title="Start a focus session"
                  onPress={() => router.push("/session/start")}
                />
              </View>
            </Card>
          )}
        </View>

        {/* Quick capture is always one tap away */}
        <View className="mt-3" ref={parkTarget} collapsable={false}>
          <Button
            title="＋ Park a thought"
            variant="ghost"
            onPress={() => router.push("/capture")}
          />
          {parking.length > 0 ? (
            <Pressable onPress={() => router.push("/parking")}>
              <Text className="mt-2 text-center text-sm text-fog">
                {parking.length} parked {parking.length === 1 ? "item" : "items"} to triage →
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* This week's lanes */}
        <View className="mt-7" ref={lanesTarget} collapsable={false}>
          <Label>This week's lanes</Label>
          <Card>
            {domains.length === 0 ? (
              <View>
                <Text className="text-base font-semibold text-white">
                  No lanes yet — and that's the point.
                </Text>
                <View className="mt-1">
                  <Muted>
                    A lane is one part of life you protect time for. Create
                    your first and give it a weekly hour budget.
                  </Muted>
                </View>
                <View className="mt-4">
                  <Button
                    title="＋ Create your first lane"
                    variant="ghost"
                    onPress={() => router.push("/lane/new")}
                  />
                </View>
              </View>
            ) : (
              domains.map((d) => (
                <Pressable
                  key={d.id}
                  onPress={() => router.push(`/lane/${d.id}/history`)}
                >
                  <LaneRow
                    name={d.name}
                    icon={d.icon}
                    color={d.color}
                    actualHours={actuals[d.id] ?? 0}
                    targetHours={d.weeklyTargetHours}
                  />
                </Pressable>
              ))
            )}
          </Card>
          {domains.length > 0 && (
            <View className="mt-2">
              <Muted>Tap a lane to see its block history.</Muted>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
