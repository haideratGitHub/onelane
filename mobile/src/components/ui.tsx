import { ReactNode, Ref, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type ScrollViewProps,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-ink" edges={["top"]}>
      {children}
    </SafeAreaView>
  );
}

/**
 * The scroll container for any screen with text inputs. Keyboard-aware by
 * default: iOS scrolls the focused input above the keyboard
 * (automaticallyAdjustKeyboardInsets); Android resizes the window (Expo's
 * default softwareKeyboardLayoutMode). Buttons stay tappable while the
 * keyboard is open. Use this instead of a bare ScrollView wherever a Field
 * could end up behind the keyboard.
 */
export function ScreenScroll(props: ScrollViewProps) {
  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
      {...props}
    />
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

// text-[16px] (not text-base): Tailwind's text-base also sets lineHeight, which
// makes iOS TextInput clip descenders (g, y, p). Set fontSize only.
export function Field({
  ref,
  ...props
}: TextInputProps & { ref?: Ref<TextInput> }) {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor="#9AA7B6"
      className="rounded-xl border border-white/10 bg-slate px-4 py-3.5 text-[16px] text-white"
      {...props}
    />
  );
}

export function PasswordField({
  ref,
  ...props
}: TextInputProps & { ref?: Ref<TextInput> }) {
  const [visible, setVisible] = useState(false);
  return (
    <View className="relative">
      <TextInput
        ref={ref}
        placeholderTextColor="#9AA7B6"
        secureTextEntry={!visible}
        className="rounded-xl border border-white/10 bg-slate py-3.5 pl-4 pr-12 text-[16px] text-white"
        {...props}
      />
      <Pressable
        className="absolute bottom-0 right-0 top-0 justify-center px-4"
        onPress={() => setVisible((v) => !v)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={visible ? "Hide password" : "Show password"}
      >
        <Ionicons
          name={visible ? "eye-off-outline" : "eye-outline"}
          size={20}
          color="#9AA7B6"
        />
      </Pressable>
    </View>
  );
}
