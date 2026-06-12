import { useEffect } from "react";
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
 * show a banner so an in-app check-in is never silently missed — except the
 * session card, which is presented at start while the user is already looking
 * at the session screen (list/lock screen only, no banner over the timer).
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => ({
    // SDK 54 split the old shouldShowAlert into banner (heads-up) + list
    // (notification center) — keep both on so check-ins are never missed.
    shouldShowBanner: notification.request.content.data?.kind !== "sessionLive",
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const CHECKIN_CATEGORY = "onelane.checkin";
export const SESSION_CATEGORY = "onelane.session";
export const PARK_ACTION = "park";

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

  // The session card's "park a thought from the lock screen" action: a text
  // input, handled in the background (the app never comes to the foreground).
  await Notifications.setNotificationCategoryAsync(SESSION_CATEGORY, [
    {
      identifier: PARK_ACTION,
      buttonTitle: "＋ Park a thought",
      textInput: {
        submitButtonTitle: "Park",
        placeholder: "The thing that just pulled at you…",
      },
      options: { opensAppToForeground: false },
    },
  ]);

  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === "granted";
}

/* ----------------------- live session card ----------------------- */

/**
 * The lock-screen session card. Not a live timer — a real ticking lock-screen
 * timer needs iOS Live Activities (native module → custom dev build, not Expo
 * Go), so this is the interim: a notification pinned for the block showing
 * lane + outcome + start time, whose long-press exposes the "Park a thought"
 * text action. Deterministic id (one card per session) so ending the block can
 * dismiss it without storing anything.
 */
function sessionNoticeId(sessionId: string): string {
  return `onelane.session.${sessionId}`;
}

export async function presentSessionNotification(
  session: Session,
  domainName: string,
): Promise<void> {
  const started = new Date(session.startAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const planned = session.plannedDurationMin
    ? ` · planned ${session.plannedDurationMin} min`
    : "";
  await Notifications.scheduleNotificationAsync({
    identifier: sessionNoticeId(session.id),
    content: {
      title: `In the lane: ${domainName}`,
      body: `${session.intendedOutcome}\nStarted ${started}${planned} — long-press to park a thought.`,
      categoryIdentifier: SESSION_CATEGORY,
      sticky: true, // Android: can't be swiped away while the block runs
      autoDismiss: false, // Android: tapping doesn't clear it; we dismiss on end
      data: { sessionId: session.id, kind: "sessionLive" },
    },
    trigger: null, // present now → notification center + lock screen
  });
}

export async function dismissSessionNotification(
  sessionId: string,
): Promise<void> {
  await Notifications.dismissNotificationAsync(sessionNoticeId(sessionId));
}

/** Cancel everything pending and clear delivered — used on account deletion. */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.dismissAllNotificationsAsync();
}

/* ----------------------- action responses ----------------------- */

// A response can be delivered twice (live listener + the cold-start fetch on
// remount); key on notification id + action + timestamp to act only once.
const handledResponses = new Set<string>();

function responseKey(r: Notifications.NotificationResponse): string {
  return `${r.notification.request.identifier}:${r.actionIdentifier}:${r.notification.date}`;
}

/**
 * Handle notification action responses. Currently: the session card's park
 * action — typed text becomes a parking-lot item via `onPark` (wired to
 * `parkDistraction` in the (app) layout). The check-in category's buttons are
 * still NOT handled (known gap). Mount once inside the authenticated area so
 * the store has a uid by the time a response arrives.
 */
export function useNotificationActions(onPark: (text: string) => void): void {
  useEffect(() => {
    const handle = (r: Notifications.NotificationResponse) => {
      const key = responseKey(r);
      if (handledResponses.has(key)) return;
      handledResponses.add(key);
      if (r.actionIdentifier === PARK_ACTION) {
        const text = r.userText?.trim();
        if (text) onPark(text);
      }
    };
    // Cold start: a response that arrived before the listener existed (e.g.
    // the app was killed and the park action launched it in the background).
    Notifications.getLastNotificationResponseAsync()
      .then((r) => r && handle(r))
      .catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, [onPark]);
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
