import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  CHECKIN_PROMPTS,
  type QuietHours,
  type Session,
  type UserSettings,
} from "@/src/domain";

/**
 * Calm, local-only notifications (no FCM, no server). All timing is derived
 * on-device from the user's session/plan times. Foreground notifications still
 * show a banner so an in-app check-in is never silently missed.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // SDK 54 split the old shouldShowAlert into banner (heads-up) + list
    // (notification center) — keep both on so check-ins are never missed.
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const CHECKIN_CATEGORY = "onelane.checkin";

export async function setupNotifications(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "onelane",
      importance: Notifications.AndroidImportance.DEFAULT,
      enableVibrate: false,
    });
  }

  // Action buttons so a check-in can be answered straight from the notification.
  await Notifications.setNotificationCategoryAsync(CHECKIN_CATEGORY, [
    { identifier: "yes", buttonTitle: "Still on it" },
    { identifier: "switched", buttonTitle: "Switched" },
    { identifier: "done", buttonTitle: "Done" },
  ]);

  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === "granted";
}

/** Minutes-from-midnight for a given epoch ms, in local time. */
function minutesOfDay(at: number): number {
  const d = new Date(at);
  return d.getHours() * 60 + d.getMinutes();
}

/** Quiet hours may wrap past midnight (e.g. 22:00–07:00). */
export function isWithinQuietHours(at: number, quiet: QuietHours): boolean {
  const m = minutesOfDay(at);
  if (quiet.start === quiet.end) return false;
  if (quiet.start < quiet.end) return m >= quiet.start && m < quiet.end;
  return m >= quiet.start || m < quiet.end; // wraps midnight
}

async function scheduleAt(
  fireAt: number,
  content: Notifications.NotificationContentInput,
  settings: UserSettings,
): Promise<string | null> {
  const now = Date.now();
  const seconds = Math.round((fireAt - now) / 1000);
  if (seconds <= 0) return null;
  if (settings.checkinStyle === "off") return null;
  if (isWithinQuietHours(fireAt, settings.quietHours)) return null;

  return Notifications.scheduleNotificationAsync({
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
}

/**
 * Schedule the (optional) mid-block check-in and the block-edge wrap-up nudge for
 * a session. Returns the ids so they can be cancelled when the block ends early.
 */
export async function scheduleSessionNudges(
  session: Session,
  domainName: string,
  settings: UserSettings,
): Promise<string[]> {
  const ids: string[] = [];
  const planned = (session.plannedDurationMin ?? 50) * 60 * 1000;

  if (settings.checkinStyle === "standard") {
    const midId = await scheduleAt(
      session.startAt + Math.floor(planned / 2),
      {
        title: CHECKIN_PROMPTS.midBlock(domainName),
        body: session.intendedOutcome,
        categoryIdentifier: CHECKIN_CATEGORY,
        data: { sessionId: session.id, kind: "midBlock" },
      },
      settings,
    );
    if (midId) ids.push(midId);
  }

  const edgeId = await scheduleAt(
    session.startAt + planned,
    {
      title: CHECKIN_PROMPTS.blockEdge(domainName),
      body: "Wrap up and capture what got done?",
      data: { sessionId: session.id, kind: "blockEdge" },
    },
    settings,
  );
  if (edgeId) ids.push(edgeId);

  return ids;
}

export async function cancelNudges(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
}
