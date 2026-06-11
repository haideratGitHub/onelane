import { View, Text } from "react-native";
import { domainProgress } from "@/src/domain";
import { formatHours } from "@/src/utils/format";

/**
 * One lane in the weekly track record: icon, name, a colored progress bar (full
 * opacity once it crosses the 70% win line), and the percentage. Progress, not
 * perfection — a behind lane is dimmed, never red-flagged.
 */
export function LaneRow({
  name,
  icon,
  color,
  actualHours,
  targetHours,
}: {
  name: string;
  icon: string;
  color: string;
  actualHours: number;
  targetHours: number;
}) {
  const p = domainProgress(actualHours, targetHours);
  const width = Math.min(100, Math.round(p.ratio * 100));

  return (
    <View className="flex-row items-center gap-3 py-2">
      <Text className="w-6 text-center text-base">{icon}</Text>
      <View className="flex-1">
        <View className="mb-1 flex-row justify-between">
          <Text className="text-sm font-medium text-white">{name}</Text>
          <Text className="text-xs text-fog">
            {formatHours(actualHours)} / {formatHours(targetHours)}
          </Text>
        </View>
        <View className="h-2.5 overflow-hidden rounded-full bg-slate">
          <View
            className="h-full rounded-full"
            style={{
              width: `${width}%`,
              backgroundColor: color,
              opacity: p.isWin ? 1 : 0.55,
            }}
          />
        </View>
      </View>
      <Text
        className="w-8 text-right text-sm"
        style={{ color: p.isWin ? color : "#9AA7B6" }}
      >
        {p.isWin ? "✓" : `${p.pct}%`}
      </Text>
    </View>
  );
}
