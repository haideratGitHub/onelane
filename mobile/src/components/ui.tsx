import { ReactNode } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-ink" edges={["top"]}>
      {children}
    </SafeAreaView>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <View className={`rounded-2xl border border-white/10 bg-asphalt p-4 ${className}`}>
      {children}
    </View>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return <Text className="text-2xl font-bold text-white">{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text className="text-sm text-fog">{children}</Text>;
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-line">
      {children}
    </Text>
  );
}

type Variant = "primary" | "ghost" | "danger";

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
}) {
  const base = "rounded-xl px-5 py-3.5 items-center justify-center";
  const styles: Record<Variant, string> = {
    primary: "bg-line",
    ghost: "border border-white/15 bg-transparent",
    danger: "border border-lane-gym bg-transparent",
  };
  const textStyles: Record<Variant, string> = {
    primary: "text-ink font-bold",
    ghost: "text-white font-semibold",
    danger: "text-lane-gym font-semibold",
  };
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`${base} ${styles[variant]} ${disabled ? "opacity-50" : ""}`}
    >
      <Text className={textStyles[variant]}>{title}</Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#9AA7B6"
      className="rounded-xl border border-white/10 bg-slate px-4 py-3.5 text-base text-white"
      {...props}
    />
  );
}
