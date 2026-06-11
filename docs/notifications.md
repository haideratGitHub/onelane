# Notifications Module

Calm, **local-only** check-ins via `expo-notifications`. **No FCM, no server, no
push.** All timing is derived on-device from the user's session times. This is a
deliberate product choice (see the product plan and the "no FCM" decision).

## Files

| File | Role |
|---|---|
| `mobile/src/notifications/notifications.ts` | The whole module: handler, permissions, Android channel, check-in category, scheduling, cancellation, quiet-hours logic. |
| `mobile/app/_layout.tsx` | Calls `setupNotifications()` once at startup. |
| `mobile/src/store/useApp.ts` | `startSession` calls `scheduleSessionNudges`; `completeActive`/`abandonActive` call `cancelNudges`. Stores `activeNudgeIds`. |
| `mobile/src/domain/constants.ts` | `CHECKIN_PROMPTS` copy; `DEFAULT_SETTINGS.quietHours` / `maxCheckinsPerDay` / `checkinStyle`. |
| `mobile/app.config.ts` | `expo-notifications` plugin (accent color). |

## What it does

- **Foreground handler:** shows a banner even when the app is open
  (`shouldShowBanner:true` + `shouldShowList:true` — SDK 54 split the old
  `shouldShowAlert` into banner/list; no sound/badge) so an in-app check-in is never
  silently missed.
- **`setupNotifications()`** (startup): creates the Android `default` channel,
  registers the `onelane.checkin` **notification category** with three actions
  (`yes` "Still on it", `switched` "Switched", `done` "Done"), and requests
  permissions. Returns whether permission was granted.
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
app start → setupNotifications() (channel + category + permissions)
session start → scheduleSessionNudges() → [midBlock?, blockEdge] → activeNudgeIds
   (each skipped if past / quiet hours / checkinStyle off; midBlock also needs "standard")
session complete/abandon → cancelNudges(activeNudgeIds)
```

## Caveats / gotchas (important)

- **Action taps are NOT handled yet.** The `onelane.checkin` category defines
  buttons, but there is **no `Notifications.addNotificationResponseReceivedListener`**
  wired up, so tapping "Still on it / Switched / Done" currently does nothing in the
  app. To make check-ins functional: add a response listener (in `app/_layout.tsx` or
  a hook), read `response.actionIdentifier` + `notification.request.content.data`
  (`{sessionId, kind}`), and call `addCheckin` on the session via the store (and
  e.g. `pauseActive`/`abandonActive` for "Switched"/route to closure for "Done").
- **iOS terminated apps can't respond to taps** — a known platform limit; the
  in-app check-in flow must remain the fallback (another reason to build the
  response listener + an in-app surface).
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

- Response listener for the check-in actions (the big one — makes check-ins
  two-way and lets them write `Checkin` records / drive session state).
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
