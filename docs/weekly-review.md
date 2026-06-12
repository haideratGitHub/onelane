# Weekly Review Module

Closure for the week: planned vs. actual per lane, a headline of how many lanes
"won", and a few honest reflection prompts. Framed as progress, never a failing
grade.

## Files

| File | Role |
|---|---|
| `mobile/app/(app)/review.tsx` | The Review screen: headline, per-lane bars, reflection fields. |
| `mobile/src/domain/review.ts` | `summarizeWeek`, `weekHeadline`, `actualHoursByDomain`. |
| `mobile/src/domain/streak.ts` | `domainProgress` (used by `LaneRow`); `currentStreak`/`longestStreak` (not yet wired). |
| `mobile/src/components/LaneRow.tsx` | One lane's progress bar; wins shown at ≥70%. |
| `mobile/src/store/useApp.ts` | `saveReflection`; state `weekSessions`, `week`, `domains`, `weekId`. |
| `mobile/src/firebase/repositories.ts` | `observeSessionsForWeek`, `observeWeek`, `upsertWeek`. |

## Data touched

- **`users/{uid}/sessions` filtered to `weekId`** (`observeSessionsForWeek`) → the
  actuals.
- **`users/{uid}/weeks/{weekId}.reflections`** — `[{prompt, answer}]`, written by
  `saveReflection`.
- Targets come from **live `domains`**, not `week.targets` (see the nuance in
  [weekly-plan.md](weekly-plan.md)).

## Flow

```
useAppSync → observeSessionsForWeek(weekId) → useApp.weekSessions
Review screen:
   targets = {domainId: domain.weeklyTargetHours}   (from live domains)
   summaries = summarizeWeek(targets, weekSessions, now, order)
   head      = weekHeadline(summaries)
   render: headline (lanesWon / lanesPlanned, actual vs planned hours)
           LaneRow per summary (domainProgress → bar + win check)
           reflection fields (WEEKLY_REFLECTION_PROMPTS)
   field blur → saveReflection(prompt, answer) → upsertWeek(reflections) → Firestore
```

## Features

- **Headline:** `weekHeadline` → "X / Y lanes won" + "Nh focused of Mh planned",
  with encouraging copy. A win is ≥70% of a lane's target.
- **Planned vs. actual bars:** one `LaneRow` per lane; bar fills to `actual/target`,
  reaches full opacity and shows a ✓ at the 70% win line, stays dimmed (not red) when
  behind — progress, not perfection.
- **Reflection:** three prompts (`WEEKLY_REFLECTION_PROMPTS`); each saves on blur,
  keyed by prompt text (re-saving the same prompt **replaces** that answer). The
  screen scrolls via `ScreenScroll` so the focused field rises above the keyboard
  (see [architecture.md](architecture.md) §8.1).

## Caveats / gotchas

- **Actuals count completed + abandoned + still-open sessions** (open up to `now`),
  per `actualHoursByDomain`. If you want stricter accounting, change it in
  `review.ts` and update [domain-model.md](domain-model.md).
- **Current week only.** There's no week switcher; `weekId` is always
  `getWeekId(now)`. So **streaks are not displayed** — `currentStreak`/`longestStreak`
  exist but need cross-week win history, which isn't fetched. Wiring streaks = fetch
  multiple `weeks` (or recompute from past sessions), derive a `boolean[]` of wins via
  `isWinningWeek`, then `currentStreak(...)`.
- **Reflections are replaced, not appended** — `saveReflection` filters out the same
  prompt before pushing the new answer.
- **Targets are live, not snapshotted** (see [weekly-plan.md](weekly-plan.md)). If a
  user lowers a target mid-week, more lanes may suddenly "win". That's currently the
  intended behavior; revisit if product wants locked plans.
- **Archived lanes still appear** when they have hours logged this week:
  `summarizeWeek` unions actuals with targets, and lane metadata resolves through
  `useApp.domainById` → `domainsAll` (all lanes incl. archived), so the row keeps its
  name/icon/color with `targetHours: 0` — honest history, no win/loss distortion.

## Known gaps

- No week navigation / history.
- Streaks not surfaced in UI.
- No cross-week trend ("am I getting better at protecting Trading time?").
- No week "close" action (the `week.status` field exists: `planned|active|closed`,
  but nothing sets `closed`).

---

## 📌 Keeping this doc in sync (read me, Claude)
Update this when you change the review computations, the reflections flow, what
counts toward actuals, or when you wire streaks / week navigation. If you switch the
targets read path to `week.targets`, reconcile this doc with
[weekly-plan.md](weekly-plan.md) and [data-firestore.md](data-firestore.md). Full
protocol in [README.md](README.md).
