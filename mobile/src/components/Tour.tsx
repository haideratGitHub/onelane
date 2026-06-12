import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { create } from "zustand";
import { Button } from "@/src/components/ui";

/**
 * Spotlight tour — website-style onboarding over the REAL app: the screen dims,
 * a hole is cut around the actual element being explained, a short tooltip sits
 * next to it, and Next moves the spotlight. No separate walkthrough screens.
 *
 * Screens expose elements with `useTourTarget(key)` (a ref for a plain
 * `<View collapsable={false}>` around the element). Tab-bar steps don't need a
 * ref — their slot rect is computed from the window size (5 equal slots).
 *
 * `TourOverlay` mounts once in `(app)/_layout.tsx` ABOVE the Tabs so it can
 * spotlight both screen content and the tab bar. Pure presentation: no data
 * access; keep step copy in sync with what the screens actually do.
 */

interface TourStep {
  key: string;
  /** Spotlight a registered on-screen target… */
  target?: string;
  /** …or a bottom tab slot (0-based, left to right). */
  tabIndex?: number;
  title: string;
  body: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    key: "welcome",
    title: "A 30-second tour",
    body: "Each part of your life is a lane — work, learning, health. onelane protects one habit: be in one lane at a time. Tap anywhere to continue.",
  },
  {
    key: "start",
    target: "start",
    title: "Start a focus block",
    body: "One lane, one outcome, one block of time. The timer runs on clock time, so locking your phone never loses a minute.",
  },
  {
    key: "park",
    target: "park",
    title: "Distraction? Park it",
    body: "Capture the thought in five seconds and get back to your lane. Nothing is lost — it waits in Parking.",
  },
  {
    key: "lanes",
    target: "lanes",
    title: "Your week at a glance",
    body: "Every lane shows hours done vs. planned this week — 70% counts as a win. Tap a lane to see every block you've logged in it.",
  },
  {
    key: "plan",
    tabIndex: 1,
    title: "Plan",
    body: "Create lanes here and give each a weekly hour budget — flexible budgets, not a rigid calendar.",
  },
  {
    key: "review",
    tabIndex: 2,
    title: "Review",
    body: "Close the week honestly: planned vs. actual per lane, plus three short reflections.",
  },
  {
    key: "parking",
    tabIndex: 3,
    title: "Parking",
    body: "Everything you parked lands here. Triage between blocks — never mid-focus.",
  },
  {
    key: "profile",
    tabIndex: 4,
    title: "Profile",
    body: "Week start day, quiet hours, check-in style, and sign out.",
  },
  {
    key: "again",
    target: "guide",
    title: "That's the tour",
    body: "Reopen it anytime from this button. Now — pick a lane and start a block.",
  },
];

interface TourState {
  active: boolean;
  step: number;
  /** Measurable nodes registered by screens, keyed by target name. */
  targets: Record<string, View | null>;
  start: () => void;
  stop: () => void;
  next: () => void;
  back: () => void;
  _register: (key: string, node: View | null) => void;
}

export const useTour = create<TourState>((set, get) => ({
  active: false,
  step: 0,
  targets: {},
  start: () => set({ active: true, step: 0 }),
  stop: () => set({ active: false }),
  next: () => {
    const { step, stop } = get();
    if (step >= TOUR_STEPS.length - 1) stop();
    else set({ step: step + 1 });
  },
  back: () => set((s) => ({ step: Math.max(0, s.step - 1) })),
  _register: (key, node) =>
    set((s) => ({ targets: { ...s.targets, [key]: node } })),
}));

/**
 * Ref callback for the View wrapping a spotlight target. The View needs
 * `collapsable={false}` so Android keeps it measurable.
 */
export function useTourTarget(key: string) {
  return useCallback(
    (node: View | null) => {
      useTour.getState()._register(key, node);
    },
    [key],
  );
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const SCRIM = "rgba(4,7,12,0.82)";
const HOLE_PAD = 8;
const TAB_COUNT = 5;
const TAB_BAR_HEIGHT = 49; // react-navigation bottom-tabs default (+ safe inset)

export function TourOverlay() {
  const active = useTour((s) => s.active);
  const step = useTour((s) => s.step);
  const stop = useTour((s) => s.stop);
  const next = useTour((s) => s.next);
  const back = useTour((s) => s.back);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [rect, setRect] = useState<Rect | null>(null);

  const current = TOUR_STEPS[step];

  // Measure the current step's target each time the step changes (and on
  // rotation). Tab slots are computed, screen targets measured in window
  // coordinates — which match the overlay since it fills the window.
  useEffect(() => {
    if (!active || !current) return;
    setRect(null);
    if (current.tabIndex != null) {
      const h = TAB_BAR_HEIGHT + insets.bottom;
      const w = width / TAB_COUNT;
      setRect({ x: current.tabIndex * w, y: height - h, w, h });
      return;
    }
    if (current.target) {
      const node = useTour.getState().targets[current.target];
      node?.measureInWindow((x, y, w, h) => {
        if (w > 0 || h > 0) setRect({ x, y, w, h });
      });
    }
  }, [active, step, current, width, height, insets.bottom]);

  if (!active || !current) return null;

  const hole = rect
    ? {
        x: Math.max(0, rect.x - HOLE_PAD),
        y: Math.max(0, rect.y - HOLE_PAD),
        w: Math.min(width, rect.w + HOLE_PAD * 2),
        h: rect.h + HOLE_PAD * 2,
      }
    : null;

  // Tooltip below the hole when the target sits in the top half, above it
  // otherwise (anchored by `bottom` so the card can grow upward).
  const tooltipPos = !hole
    ? { top: 0, bottom: 0, justifyContent: "center" as const }
    : hole.y + hole.h / 2 < height / 2
      ? { top: hole.y + hole.h + 12 }
      : { bottom: height - hole.y + 12 };

  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <View className="absolute bottom-0 left-0 right-0 top-0">
      {/* Swallows every touch (including inside the hole) and advances. */}
      <Pressable
        className="absolute bottom-0 left-0 right-0 top-0"
        onPress={next}
        accessibilityLabel="Next tour step"
      />

      {hole ? (
        <>
          {/* Scrim in four strips around the spotlight hole. */}
          <View
            pointerEvents="none"
            style={{ position: "absolute", left: 0, top: 0, width, height: hole.y, backgroundColor: SCRIM }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              top: hole.y + hole.h,
              width,
              height: Math.max(0, height - hole.y - hole.h),
              backgroundColor: SCRIM,
            }}
          />
          <View
            pointerEvents="none"
            style={{ position: "absolute", left: 0, top: hole.y, width: hole.x, height: hole.h, backgroundColor: SCRIM }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: hole.x + hole.w,
              top: hole.y,
              width: Math.max(0, width - hole.x - hole.w),
              height: hole.h,
              backgroundColor: SCRIM,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: hole.x,
              top: hole.y,
              width: hole.w,
              height: hole.h,
              borderWidth: 2,
              borderColor: "#FACC15",
              borderRadius: 16,
            }}
          />
        </>
      ) : (
        <View
          pointerEvents="none"
          style={{ position: "absolute", left: 0, top: 0, width, height, backgroundColor: SCRIM }}
        />
      )}

      {/* Tooltip card */}
      <View
        pointerEvents="box-none"
        style={{ position: "absolute", left: 0, right: 0, ...tooltipPos }}
      >
        <View className="mx-5 rounded-2xl border border-white/10 bg-asphalt p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wider text-line">
              {step + 1} of {TOUR_STEPS.length}
            </Text>
            <Pressable onPress={stop} hitSlop={8}>
              <Text className="text-sm text-fog">Skip tour</Text>
            </Pressable>
          </View>
          <Text className="mt-2 text-lg font-bold text-white">
            {current.title}
          </Text>
          <Text className="mt-1 text-[15px] leading-5 text-fog">
            {current.body}
          </Text>
          <View className="mt-4 flex-row gap-3">
            {step > 0 && (
              <View className="flex-1">
                <Button title="Back" variant="ghost" onPress={back} />
              </View>
            )}
            <View className="flex-1">
              <Button title={isLast ? "Done" : "Next"} onPress={next} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
