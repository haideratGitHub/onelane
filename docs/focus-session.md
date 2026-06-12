# Focus Session Module (the core loop)

The heart of onelane: commit to one lane, state one outcome, run a timestamp-based
timer, capture distractions without leaving, get a gentle yak-shave nudge if you
overrun, and close with "what got done". This is the feature the whole product is
built around.

## Files

| File | Role |
|---|---|
| `mobile/app/session/start.tsx` | Modal ("Start a focus session"): pick a lane + state the one outcome + block length (30/60/90 or custom) → `startSession`. |
| `mobile/app/session/[id].tsx` | The live focus screen: pinned outcome, timer, pause/resume, capture, closure, abandon. |
| `mobile/app/capture.tsx` | Quick parking capture, reachable from the session (see [parking-lot.md](parking-lot.md)). |
| `mobile/app/(app)/index.tsx` | Today screen: shows the active-session card or the "Start a focus session" CTA. |
| `mobile/src/store/useApp.ts` | Actions: `startSession`, `pauseActive`, `resumeActive`, `completeActive`, `abandonActive` (+ `activeSession`, `activeNudgeIds` state). |
| `mobile/src/hooks/useElapsed.ts` | Live elapsed ms for the UI (display refresh only). |
| `mobile/src/domain/session.ts` | Pure timer logic ([domain-model.md](domain-model.md)). |
| `mobile/src/notifications/notifications.ts` | Schedules/cancels the check-in + block-edge nudges ([notifications.md](notifications.md)). |

## Data touched

- **`users/{uid}/sessions/{sessionId}`** — created on start, merged on every
  state change, finalized on complete/abandon. Shape in [data-firestore.md](data-firestore.md).
- Reads the active session via `observeActiveSession` (status==active, limit 1).

## End-to-end flow

```
Today (/) ──"Start"──► /session/start (modal)
   pick domain + outcome + minutes
        │ startSession()
        ▼
  newSession(id=newSessionId, now)  →  store.activeSession (optimistic)
        │                              createSession(uid, session)  → Firestore
        │                              scheduleSessionNudges()       → activeNudgeIds
        │                              presentSessionNotification()  → lock-screen card
        ▼
  router.replace(/session/<id>)
        │
   ┌────┴─────────────────────────────────────────┐
   │ /session/[id]                                 │
   │  • pinned intendedOutcome (anti-yak-shave)    │
   │  • timer = useElapsed(activeSession)          │
   │  • Pause/Resume → pauseActive/resumeActive    │
   │  • "Park a thought" → /capture (modal)        │
   │  • overrun banner if hasOverrun(now)          │
   │  • "End block" → closure note → completeActive│
   │  • "Leave the lane" → confirm → abandonActive │
   └───────────────────────────────────────────────┘
        │ complete/abandon: finalize session, set activeSession=null,
        │ cancelNudges(activeNudgeIds) + dismissSessionNotification()
        ▼
  router.replace(/)   (Today; Review reflects the new actuals)
```

The active session is read from the store (kept live by `observeActiveSession`), so
the session screen, the Today card, and the timer all stay consistent even if the app
is reopened — `/session/[id]` reads `activeSession` from the store, not the route id,
and `<Redirect href="/" />`s if there's no active session.

## Features & how each works

- **Start a focus session (`start.tsx`):** lane chips (from `domains`), a multiline
  "one outcome" field, and block-length chips — **30 / 60 / 90 min plus "Custom"**
  (number-pad field, clamped 5–240 min; invalid custom input disables Start). The
  title says "Start a focus session" (the user just tapped a button with that label —
  don't reintroduce "Enter a lane"). Default is `DEFAULT_BLOCK_MINUTES` (60). Start
  is disabled until a lane, a non-empty outcome, and valid minutes are set.
  `plannedDurationMin` seeds the nudge timing and the yak-shave threshold. With no
  lanes yet, the modal links to `/lane/new`. Keyboard-aware via `ScreenScroll`.
- **Pinned outcome:** the `intendedOutcome` is shown in a card at the top of the
  session the entire block — the anchor that fights yak-shaving.
- **Timestamp-based timer:** `useElapsed(activeSession)` recomputes
  `elapsedMs(session, Date.now())` every second **for display** and also on app
  foreground (`AppState` "active"). The value is always derived from stored
  timestamps, so it's correct after backgrounding/kill. **Never** convert this to a
  counter (see [architecture.md](architecture.md) §5.2).
- **Pause / resume:** closes/opens a segment via the pure helpers; paused time does
  not count. Each transition persists via `updateSession`.
- **Planned duration visible:** the status line under the timer shows
  `Focused · planned 60 min` (when `plannedDurationMin` is set), so the soft target
  is visible before the overrun banner ever appears.
- **Yak-shave guard:** once `hasOverrun(session, now)` (elapsed > planned, or 50-min
  fallback), a calm banner appears suggesting you park the side-quest or close the
  block. It does not block anything.
- **Closure:** "End block" switches the screen to a one-line "what got done" capture;
  `completeActive(note)` finalizes the session (status `completed`, `endAt`,
  trimmed note) and cancels the nudges.
- **Leave the lane (abandon):** confirm dialog → `abandonActive()` (status
  `abandoned`, no forced note). Framed as no-penalty (progress over perfection).
  Abandoned time still counts toward weekly actuals.
- **Check-in nudges:** on start, a mid-block check-in (only if `checkinStyle ==
  "standard"`) and a block-edge wrap-up are scheduled; their ids are kept in
  `activeNudgeIds` and cancelled on finish. Details in [notifications.md](notifications.md).
- **Lock-screen session card + park-from-lock-screen:** session start also presents
  a notification (lane, outcome, start time, planned minutes) that sits on the lock
  screen for the block; long-pressing it exposes a **"＋ Park a thought" text action**
  that writes a parking item without opening the app. Dismissed on complete/abandon.
  It is a static card, not a live timer (Live Activities = dev-build follow-up).
  Details in [notifications.md](notifications.md).

## Caveats / gotchas (read before changing)

- **Single active session is assumed, not enforced.** `startSession` does **not**
  check for an existing active session before creating one. The UI prevents a second
  start (Today shows the active card / routes to it), but if you add a new entry point
  to `/session/start`, guard it: if `useApp.getState().activeSession` exists, route to
  it instead of starting another — otherwise `observeActiveSession`'s `limit(1)` will
  arbitrarily pick one and the other becomes an orphan. Consider adding a hard guard
  in `startSession`.
- **`/session/[id]` ignores its `id` param.** It renders the store's `activeSession`.
  That's intentional (one active session), but means deep-linking to an old session id
  won't show that session. If you add session history viewing, read by id from
  Firestore instead.
- **Optimistic then reconciled:** actions set `activeSession` locally before the
  Firestore write resolves; the listener later overwrites with the server copy. If you
  add fields, make sure the optimistic object and the persisted doc match, or the UI
  will flicker on reconcile.
- **Nudge cancellation is best-effort** (`.catch(() => {})`). A failed cancel just
  means a stale local notification may fire; harmless but note it.
- **Closure note trimming:** empty note → stored as `null` (see `complete`). Don't
  assume a string.

## Known gaps

- ~~No session history UI~~ — **done per lane**: `/lane/[id]/history` lists a lane's
  finished blocks (see [weekly-plan.md](weekly-plan.md)). Still no "resume previous
  block" and no cross-lane chronological history.
- No hard single-active-session guard.
- Notification action buttons (Still on it / Switched / Done) are scheduled but their
  taps aren't yet handled in-app (see [notifications.md](notifications.md)).
- `plannedDurationMin` is a soft target only; there's no auto-stop at the edge (by
  design — calm, not coercive).

---

## 📌 Keeping this doc in sync (read me, Claude)
Update this whenever you change how a session is started, timed, paused, closed, or
abandoned; the session screens; the active-session actions; or the nudge
scheduling/cancellation tied to a session. Keep the action names and the flow diagram
accurate. If you add a single-active-session guard, update the Caveats. Full protocol
in [README.md](README.md).
