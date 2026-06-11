# Domain Model (pure core logic)

The framework-free heart of onelane. **No React, no Firebase, no Expo** — just types
and pure functions. It is the only part of the app with real unit tests (34, via
vitest) and is where all the timer/week/streak/review correctness lives.

- **Location:** `mobile/src/domain/`
- **Tests:** `mobile/src/domain/__tests__/*.test.ts` — run with `npm test` (in `mobile/`)
- **Barrel:** everything is re-exported from `mobile/src/domain/index.ts`; import via `@/src/domain`.

## Why this module exists separately

Keeping this logic pure means: (a) it's testable in plain Node, (b) UI and Firebase
can change without touching correctness, (c) the same functions back both live
screens and the weekly review. **Rule: never import React/Firebase/Expo here, and
never call `Date.now()`/`new Date()` inside these functions** — always take the
current time as a parameter. This is what makes them deterministic and testable.

## Files

| File | Responsibility |
|---|---|
| `types.ts` | All domain interfaces/types. The data shapes for the whole app. |
| `constants.ts` | `WIN_THRESHOLD`, `MAX_REASONABLE_WEEK_HOURS`, default settings, `DEFAULT_DOMAINS`, reflection/check-in copy. |
| `settings.ts` | `mergeSettings(partial)` — partial/missing persisted settings → complete `UserSettings` (deep-merges `quietHours`). |
| `week.ts` | Week identity + ranges (`getWeekId`, `weekIdToStart`, `getWeekRange`, `isInWeek`, `formatWeekRange`). |
| `session.ts` | The timestamp-based timer: create/elapsed/pause/resume/complete/abandon + yak-shave check. |
| `review.ts` | Aggregation for the weekly review (`actualHoursByDomain`, `summarizeWeek`, `weekHeadline`). |
| `streak.ts` | Anti-fragile streaks + per-lane progress labels. |
| `index.ts` | Barrel re-export. |

## Entities (`types.ts`)

All timestamps are **epoch ms (`number`)** — see [architecture.md](architecture.md) §5.1.

- **`Domain`** (a "lane"): `{ id, name, color, icon, weeklyTargetHours, order, archived }`.
- **`Session`** (a focus block): `{ id, domainId, weekId, intendedOutcome, startAt, endAt|null, segments[], plannedDurationMin|null, status, closureNote|null, checkins[] }`.
- **`Segment`**: `{ start, end|null }` — a span of focused time; an open segment (`end===null`) means the timer is running.
- **`SessionStatus`**: `"active" | "completed" | "abandoned"`.
- **`Checkin`**: `{ at, prompt, response: "yes"|"switched"|"done"|"no"|null }`.
- **`ParkingLotItem`**: `{ id, text, createdAt, originSessionId|null, domainId|null, status }` where status ∈ `"open"|"done"|"promoted"|"dismissed"`.
- **`Week`**: `{ id, startsAt, targets: Record<domainId, hours>, reflections[], status: "planned"|"active"|"closed" }`.
- **`UserSettings`**: `{ weekStartsOn(0–6), timezone, quietHours{start,end minutes}, maxCheckinsPerDay, checkinStyle: "gentle"|"standard"|"off" }`.
- **`DomainWeekSummary`**: computed row for the review: `{ domainId, targetHours, actualHours, ratio, isWin }`.

## Constants (`constants.ts`)

- **`WIN_THRESHOLD = 0.7`** — a lane "wins" at ≥70% of its target. This single number
  encodes "progress over perfection"; it's referenced by `streak.ts` and `review.ts`.
- **`DEFAULT_BLOCK_MINUTES = 50`** — default block length / yak-shave fallback.
- **`MAX_REASONABLE_WEEK_HOURS = 60`** — above this total the Plan screen shows the
  right-sizing nudge.
- **`DEFAULT_SETTINGS`** — Monday week start, quiet hours 22:00–07:00, max 6 check-ins/day, `standard` style. The fallback base for `mergeSettings` (persisted settings overlay it).
- **`DEFAULT_DOMAINS`** — the 5 starter lanes (Office/Trading/SaaS/Learning/Gym) with colors, icons (emoji, used in the app UI), and target hours. Seeded on first login.
- **`WEEKLY_REFLECTION_PROMPTS`**, **`CHECKIN_PROMPTS`** — UI copy kept here so it's consistent.

## `week.ts` — week identity

A **WeekId** is a stable string like `"2026-W24"`. It is **not** ISO-8601 week
numbering; it's a custom, stable scheme: the week number is 1-based within the year
of that week's **start day**, computed off a configurable `weekStartsOn` (default
Monday). Properties that matter (and are tested):
- Every day in the same week → same id.
- Consecutive weeks differ by one.
- `weekIdToStart(getWeekId(d)) === getWeekStart(d)` (round-trips).

| Function | Signature | Notes |
|---|---|---|
| `getWeekStart(date, weekStartsOn=1)` | `Date → Date` | Local-midnight of the week's first day. DST-safe (uses `setDate`, not ms math). |
| `getWeekId(date, weekStartsOn=1)` | `Date → WeekId` | The grouping key. |
| `weekIdToStart(weekId, weekStartsOn=1)` | `WeekId → Date` | Inverse of `getWeekId`. Throws on malformed id. |
| `getWeekRange(weekId, weekStartsOn=1)` | `→ {start, end}` (epoch ms) | `start` inclusive, `end` exclusive (start of next week). |
| `isInWeek(at, weekId, weekStartsOn=1)` | `→ boolean` | `start <= at < end`. |
| `formatWeekRange(weekId, weekStartsOn=1)` | `→ "Jun 8 – Jun 14"` | Display label. |

**Caveats:**
- Everything is **local time** (uses `Date` local getters). Fine for a personal app;
  if you ever need timezone-correct grouping, this is where to change it.
- `weekStartsOn` is threaded as a parameter; the app currently always passes the
  default (Monday) because settings aren't persisted. If you persist settings, pass
  `settings.weekStartsOn` consistently to **all** of these or ids won't line up.

## `session.ts` — the timer (most important file)

The timer is **timestamp-based** (see [architecture.md](architecture.md) §5.2). A
session is a list of `segments`; elapsed time is the sum of all segments with an open
segment counting up to `now`.

| Function | Signature | Semantics |
|---|---|---|
| `newSession(args)` | `{id,domainId,weekId,intendedOutcome,plannedDurationMin?,now} → Session` | Running session, one open segment, trimmed outcome. |
| `elapsedMs(session, now)` | `→ number` | **Source of truth for elapsed.** Sums segments; open segment → `now - start`. |
| `elapsedMinutes(session, now)` | `→ number` | Floor of elapsed in minutes. |
| `isRunning(session)` | `→ boolean` | active **and** last segment open. |
| `isPaused(session)` | `→ boolean` | active **and** last segment closed. |
| `pause(session, now)` | `→ Session` | Closes the open segment. No-op if not running. |
| `resume(session, now)` | `→ Session` | Opens a new segment. No-op if running/finished. |
| `complete(session, now, note)` | `→ Session` | Closes segment, sets `endAt`, `status="completed"`, trims note→`null` if empty. |
| `abandon(session, now, note=null)` | `→ Session` | Same but `status="abandoned"`, note optional. |
| `addCheckin(session, {at,prompt,response?})` | `→ Session` | Appends a check-in (default `response:null`). |
| `hasOverrun(session, now, fallbackMinutes=50)` | `→ boolean` | True once elapsed exceeds `plannedDurationMin` (or fallback). Drives the yak-shave nudge. |

All of these are **pure and return new objects** (no mutation). They're safe to call
optimistically in the store and then persist.

**Caveats:**
- Once `complete`/`abandon` close the session, `elapsedMs` is frozen (all segments
  closed) — calling it with a later `now` won't grow it. Tests assert this.
- `elapsedMs` counts paused gaps as not elapsed (correct), because paused = last
  segment closed.

## `review.ts` — weekly aggregation

| Function | Signature | Semantics |
|---|---|---|
| `actualHoursByDomain(sessions, now)` | `→ Record<domainId, hours>` | Sums `elapsedMs/3600000` per domain. **Counts completed, abandoned, and still-open sessions** (open ones up to `now`). |
| `summarizeWeek(targets, sessions, now, domainOrder=[])` | `→ DomainWeekSummary[]` | One row per domain in `targets`∪actuals; `ratio = actual/target` (0 if target 0); `isWin = target>0 && ratio≥0.7`. Sorted by `domainOrder` if given. |
| `weekHeadline(summaries)` | `→ {plannedHours, actualHours, lanesWon, lanesPlanned}` | Totals + counts; only domains with target>0 count as "planned". |

**Caveat:** abandoned time **is** counted toward actuals (the time was really spent).
If product later wants "only completed counts", change `actualHoursByDomain` and
update its test.

## `streak.ts` — anti-fragile streaks

A "win" is ≥70% (never 100%). A single miss ends the current streak but never
deletes history (no quit-on-one-miss).

| Function | Signature | Semantics |
|---|---|---|
| `isWinningWeek(actual, target)` | `→ boolean` | `target>0 && actual/target ≥ 0.7`. |
| `currentStreak(weeklyWinsRecentFirst[])` | `→ number` | Counts leading wins (most-recent-first). |
| `longestStreak(weeklyWins[])` | `→ number` | Best run anywhere. |
| `domainProgress(actual, target)` | `→ {ratio, pct, isWin, toWin, label}` | Per-lane display; `label ∈ won \| on-track(≥50%) \| behind \| unplanned(target 0)`. Used by the mobile `LaneRow` component. |

**Note:** `currentStreak`/`longestStreak` are **not yet wired into any screen** —
the app only loads the current week, so there's no win history to feed them. Wiring
them is a known gap (see [weekly-review.md](weekly-review.md)).

## How to change this module safely

- **Adding a field to an entity?** Update `types.ts`, then every place that builds
  that entity (repositories' `toDoc`/`fromDoc` are generic and need no change since
  the doc is the object minus `id`), and the Firestore schema notes in
  [data-firestore.md](data-firestore.md). Keep it a `number` if it's a timestamp.
- **Changing timer behavior?** Do it in `session.ts` only, keep it timestamp-based,
  and update/extend `__tests__/session.test.ts`. Never move elapsed into a counter.
- **Changing the win rule?** Change `WIN_THRESHOLD` once; review + streak + the
  landing page (`web` hardcodes "70%+" copy) all follow — update the web copy by hand.
- **Always run `npm test`** after changes here; these tests are fast and are your
  safety net. Prefer asserting invariants (same-week, round-trip, frozen-after-finish)
  over absolute numbers, as the existing tests do.

---

## 📌 Keeping this doc in sync (read me, Claude)
Whenever you add/change/remove a domain type, constant, or function in
`mobile/src/domain/`, update the corresponding table/section here and adjust the
tests. If you add a function, add a row with its exact signature and semantics. If a
behavior nuance bites you (e.g. what counts toward actuals), record it under Caveats.
Full protocol in [README.md](README.md).
