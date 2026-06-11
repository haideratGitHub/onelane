# Weekly Plan Module (lanes & budgets)

Setting up the week: the life domains ("lanes") and each lane's **flexible weekly
hour budget** — deliberately budgets, not rigid clock blocks. Includes the gentle
right-sizing nudge for over-ambitious weeks.

## Files

| File | Role |
|---|---|
| `mobile/app/(app)/plan.tsx` | The Plan screen: total-hours card + per-lane ± steppers; hosts Sign out. |
| `mobile/src/store/useApp.ts` | `setDomainTarget`, `ensureWeek`; state `domains`, `week`. |
| `mobile/src/firebase/repositories.ts` | `observeDomains`, `updateDomain`, `createDomain`, `observeWeek`, `upsertWeek`, `bootstrapDomains`. |
| `mobile/src/domain/constants.ts` | `DEFAULT_DOMAINS` (the starter lanes seeded on first login). |
| `mobile/src/components/LaneRow.tsx` | Lane progress bar (shared with Review/Today). |

## Data touched

- **`users/{uid}/domains/{domainId}`** — `{ name, color, icon, weeklyTargetHours,
  order, archived }`. The lanes. Edited here (target hours).
- **`users/{uid}/weeks/{weekId}`** — `{ startsAt, targets:{domainId:hours},
  reflections, status }`. The week's plan snapshot.

## Flow

```
sign-in (first time) → bootstrapDomains → DEFAULT_DOMAINS written
useAppSync → observeDomains → useApp.domains (orderBy "order", non-archived)
           → observeWeek    → useApp.week; if null → ensureWeek()
Plan screen:
   ± stepper → setDomainTarget(id, hours) → updateDomain(weeklyTargetHours) → Firestore
   total = Σ weeklyTargetHours; if > 60h → right-sizing nudge
```

`ensureWeek()` runs when the current `weekId` has no doc yet and domains are loaded:
it snapshots `targets = {domainId: weeklyTargetHours}` for every domain and writes a
`weeks/{weekId}` doc with `status:"active"`.

## Features

- **Lanes from defaults:** new users get 5 starter lanes (Office/Trading/SaaS/
  Learning/Gym) with colors, icons, and target hours.
- **Edit target hours:** ± steppers adjust `weeklyTargetHours` (clamped at ≥0) with
  optimistic update + Firestore write.
- **Total + right-sizing nudge:** the Plan screen sums all targets; when total **>
  60h** it shows a calm "that's ambitious — consider right-sizing so 70% is
  realistic" message (the brief's ~81h plan should be questioned, not blindly
  executed). 70% framing is shown otherwise.
- **Sign out** lives at the bottom of this screen (see [auth.md](auth.md)).

## ⚠️ Important nuance: targets snapshot vs. live targets

`week.targets` is **snapshotted once** by `ensureWeek` when the week is first seen.
But the **Review screen computes targets from the live `domains`**, not from
`week.targets`. So:
- Editing a lane's target **immediately** changes what Today/Review compare against
  (they read live domains).
- `week.targets` is stored for history but is **not** the current read path.

Decide intentionally if you change this. If you want "the plan is locked once the
week starts", switch Review to read `week.targets` and stop editing affecting the
current week — and update [weekly-review.md](weekly-review.md) + [data-firestore.md](data-firestore.md).

## Caveats / gotchas

- **No add/rename/archive/reorder UI** — only target editing. The schema supports
  `createDomain`/`archived`/`order`, but no screen calls them yet. Adding lanes means
  building that UI (and keeping the lane color palette in sync — see
  [architecture.md](architecture.md) §8).
- **Right-size threshold (60h) is a magic number** in `plan.tsx`. If it should be
  configurable or tied to settings, refactor and note it.
- **`weekStartsOn` is effectively Monday** because settings aren't persisted; the
  week the plan applies to is always `getWeekId(now)`.

## Known gaps

- Lane CRUD (add/rename/recolor/archive/reorder).
- Plan locking (snapshot-based review).
- Per-day scheduling (the brief's "trading overlaps office hours" is not modeled;
  budgets are weekly, not time-of-day).

---

## 📌 Keeping this doc in sync (read me, Claude)
Update this when you change lane management, target editing, the right-sizing nudge,
`ensureWeek`, or the `domains`/`weeks` shapes. Pay special attention to the
"targets snapshot vs. live targets" nuance — if you change which one Review reads,
update both docs. Full protocol in [README.md](README.md).
