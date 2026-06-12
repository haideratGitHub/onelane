# Notifications Module

Calm, **local-only** check-ins via `expo-notifications`. **No FCM, no server, no
push.** All timing is derived on-device from the user's session times. This is a
deliberate product choice (see the product plan and the "no FCM" decision).

## Files

| File | Role |
|---|---|
| `mobile/src/notifications/notifications.ts` | The whole module: handler, permissions, Android channel, check-in + session categories, the lock-screen session card (`presentSessionNotification`/`dismissSessionNotification`), the response hook (`useNotificationActions`), scheduling, cancellation, quiet-hours logic. |
| `mobile/app/_layout.tsx` | Calls `setupNotifications()` once at startup. |
| `mobile/app/(app)/_layout.tsx` | Mounts `useNotificationActions(parkDistraction)` — handles the park text action from the session card. |
| `mobile/src/store/useApp.ts` | `startSession` calls `scheduleSessionNudges` + `presentSessionNotification`; `completeActive`/`abandonActive` call `cancelNudges` + `dismissSessionNotification`. Stores `activeNudgeIds`. |
| `mobile/src/domain/constants.ts` | `CHECKIN_PROMPTS` copy; `DEFAULT_SETTINGS.quietHours` / `maxCheckinsPerDay` / `checkinStyle`. |
| `mobile/app.config.ts` | `expo-notifications` plugin (accent color). |

## What it does

- **Foreground handler:** shows a banner even when the app is open
  (`shouldShowBanner:true` + `shouldShowList:true` — SDK 54 split the old
  `shouldShowAlert` into banner/list; no sound/badge) so an in-app check-in is never
  silently missed. Exception: `data.kind === "sessionLive"` suppresses the banner
  (the card is presented at session start while the user is looking at the timer)
  but keeps the list, so it reaches the lock screen / notification center.
- **`setupNotifications()`** (startup): creates the Android `default` channel,
  registers the `onelane.checkin` **notification category** with three actions
  (`yes` "Still on it", `switched` "Switched", `done` "Done") and the
  `onelane.session` category with one **text-input action** (`park` "＋ Park a
  thought", `opensAppToForeground:false`), and requests permissions. Returns whether
  permission was granted.
- **Lock-screen session card** — `presentSessionNotification(session, domainName)`
  on session start (trigger `null`, deterministic id `onelane.session.<sessionId>`):
  title "In the lane: {domain}", body = outcome + start time + planned minutes.
  **Not a live timer** (that's iOS Live Activities → custom dev build; see
  [architecture.md](architecture.md) §10) — its job is the **park-from-lock-screen**
  action: long-press the card → "＋ Park a thought" → type → Park, and the thought
  lands in the parking lot without the app coming to the foreground. Android:
  `sticky:true`/`autoDismiss:false` pin it for the block. Dismissed via
  `dismissSessionNotification(sessionId)` on complete/abandon.
- **`useNotificationActions(onPark)`** (mounted in `(app)/_layout.tsx`): the
  response listener. Handles `actionIdentifier === "park"` → `onPark(userText)` →
  `parkDistraction`. Also drains `getLastNotificationResponseAsync()` on mount for
  cold starts, with a module-level dedupe set (id + action + date) so a response is
  acted on exactly once. Check-in actions are deliberately not handled yet.
- **The card survives parking** — iOS auto-dismisses an actioned notification, so
  the `onPark` callback re-presents the card (same deterministic id) while a
  session is still active. Parking several thoughts in a row from the lock screen
  keeps working; once the block ends, nothing is re-presented.
- **`scheduleSessionNudges(session, domainName, settings)`** (on start): schedules
  - a **mid-block check-in** at `startAt + planned/2` — only if `checkinStyle ==
    "standard"` — using the check-in category ("Still on {domain}?");
  - a **block-edge** wrap-up at `startAt + planned` ("Wrap up {domain}?").
  Returns the scheduled ids → stored in `useApp.activeNudgeIds`.
- **`cancelNudges(ids)`** (on complete/abandon): cancels the scheduled notifications.
- **Quiet hours / off-switch:** `scheduleAt` skips scheduling when
  `checkinStyle == "off"`, when the fire time is in the past, or when it falls within
  `quietHours` (which may wrap past midnight — handled by `isWithinQuietHours`).

Trigger type used: `SchedulableTriggerInputTypes.TIME_INTERVAL` with `seconds`
computed from `Date.now()`.

## Flow

```
app start → setupNotifications() (channel + categories + permissions)
session start → scheduleSessionNudges() → [midBlock?, blockEdge] → activeNudgeIds
   (each skipped if past / quiet hours / checkinStyle off; midBlock also needs "standard")
             → presentSessionNotification() → lock-screen card (id from session id)
lock screen  → long-press card → "＋ Park a thought" (text) → response listener
             → useNotificationActions → parkDistraction(text)   [app stays closed]
session complete/abandon → cancelNudges(activeNudgeIds) + dismissSessionNotification()
```

## Caveats / gotchas (important)

- **Check-in action taps are still NOT handled.** A response listener now exists
  (`useNotificationActions`) but it only handles the session card's `park` action.
  To make check-ins functional, extend it: on `yes`/`switched`/`done`, read
  `notification.request.content.data` (`{sessionId, kind}`) and call `addCheckin`
  via the store (and e.g. `abandonActive` for "Switched" / route to closure for
  "Done").
- **The session card is static** — it shows start time + planned minutes, not a
  ticking countdown. A live lock-screen timer (and Dynamic Island) is iOS **Live
  Activities** = native module = custom dev build; revisit when the dev-build
  follow-up happens. Don't fake it by rescheduling notifications every minute.
- **Park-from-lock-screen requires permission + device settings** — iOS delivers
  the text response in the background; if the app was terminated, the response is
  drained on next launch via `getLastNotificationResponseAsync` (the dedupe set
  prevents double-parking). The listener is mounted in the authed layout, so the
  store has a uid before a response is processed.
- **The card isn't re-presented on app relaunch** — if the user swipes it away (iOS
  allows it; Android's is sticky) it stays gone for that block. Harmless: parking
  still works in-app.
- **Re-present-after-park can be skipped on a cold start** — if the park response
  launches a killed app, `activeSession` may not have loaded from Firestore yet
  when `onPark` runs; the thought is still parked, only the card isn't restored.
  Edge case; fix would be re-presenting from the active-session listener.
- **iOS terminated apps can't respond to plain button taps** — a known platform
  limit; the in-app check-in flow must remain the fallback.
- **`maxCheckinsPerDay` is defined but not enforced** in scheduling — only
  `checkinStyle` (`off`) and quiet hours gate scheduling today. If notification
  fatigue shows up, enforce the daily cap here.
- **Local notifications need a foregrounded JS context to be *scheduled*** (they're
  scheduled at session start, which is fine). They then fire even if the app is
  closed because the OS owns the schedule.
- **Settings are user-configurable now** — quiet hours, `checkinStyle`, and
  `maxCheckinsPerDay` are edited on the Profile tab and persisted to
  `users/{uid}.settings` (see [data-firestore.md](data-firestore.md));
  `scheduleSessionNudges` receives them via `useApp.settings`. New devices fall back
  to `DEFAULT_SETTINGS` until the doc loads.
- **`scheduleSessionNudges` is wrapped in `.catch(() => [])`** at the call site, so a
  scheduling failure (e.g. denied permission) won't break session start; you just get
  no nudges.

## Known gaps

- Check-in actions in the response listener (makes check-ins two-way and lets them
  write `Checkin` records / drive session state — the listener + dedupe plumbing
  already exists, only the action handling is missing).
- Live Activities lock-screen timer (custom dev build).
- End-of-day "Did you do your {domain} block?" log nudge — copy exists
  (`CHECKIN_PROMPTS.endOfDayLog`) but nothing schedules it.
- Daily cap enforcement.
- Per-user permission state surfaced in UI (re-ask / settings deep link).

---

## 📌 Keeping this doc in sync (read me, Claude)
Update this when you change scheduling, the category/actions, quiet-hours logic, or
(especially) when you implement the response listener or the daily cap. Keep the
trigger type, the `data` payload shape (`{sessionId, kind}`), and the gating
conditions exact. Full protocol in [README.md](README.md).
