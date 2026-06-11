import { View, Text, Pressable, ScrollView } from "react-native";
import { Screen, Heading, Muted, Card, Label } from "@/src/components/ui";
import { useApp } from "@/src/store/useApp";

export default function Parking() {
  const parking = useApp((s) => s.parking);
  const resolveParking = useApp((s) => s.resolveParking);
  const domainById = useApp((s) => s.domainById);

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-5 pb-12 pt-2">
        <Heading>Parking lot</Heading>
        <Muted>Impulses you honored without obeying. Triage them now, on your terms.</Muted>

        <View className="mt-5">
          <Label>{parking.length} open</Label>
          {parking.length === 0 ? (
            <Card>
              <Muted>Nothing parked. A clear lot is a focused week.</Muted>
            </Card>
          ) : (
            parking.map((item) => {
              const d = item.domainId ? domainById(item.domainId) : undefined;
              return (
                <Card key={item.id} className="mb-3">
                  <Text className="text-base text-white">{item.text}</Text>
                  {d ? (
                    <Text className="mt-1 text-xs text-fog">
                      from {d.icon} {d.name}
                    </Text>
                  ) : null}
                  <View className="mt-3 flex-row gap-2">
                    <Action
                      label="Done"
                      onPress={() => resolveParking(item.id, "done")}
                    />
                    <Action
                      label="Dismiss"
                      onPress={() => resolveParking(item.id, "dismissed")}
                    />
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-lg border border-white/15 px-4 py-2"
    >
      <Text className="text-sm font-medium text-white">{label}</Text>
    </Pressable>
  );
}
