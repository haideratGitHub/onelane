# Weekly Plan Module (lanes & budgets)

Setting up the week: the life domains ("lanes") and each lane's **flexible weekly
hour budget** — deliberately budgets, not rigid clock blocks. Includes full lane
management (add/edit/archive) and the gentle right-sizing nudge for over-ambitious
weeks.

## Files

| File | Role |
|---|---|
| `mobile/app/(app)/plan.tsx` | The Plan screen: total-hours card, per-lane ± steppers, tappable lane cards (→ editor), "＋ Add lane". |
| `mobile/app/lane/[id].tsx` | **Lane editor modal** (`/lane/new` to create): name, emoji icon grid, color swatches, target stepper, Archive (with guards). Root-level modal like `session/*`. |
| `mobile/src/store/useApp.ts` | `setDomainTarget`, `addDomain`, `editDomain`, `archiveDomain`, `loggedHoursFor`, `ensureWeek`; state `domains` (active), `domainsAll` (incl. archived). |
| `mobile/src/firebase/repositories.ts` | `observeDomains` (**emits all, incl. archived**), `updateDomain`, `createDomain`, `observeWeek`, `upsertWeek`, `bootstrapDomains`. |
| `mobile/src/domain/constants.ts` | `DEFAULT_DOMAINS` (starter lanes), `MAX_REASONABLE_WEEK_HOURS` (right-size threshold). |
| `mobile/src/theme.ts` | `LANE_PALETTE` (colors), `LANE_ICONS` (emoji choices), `laneColor(order)`. |
| `mobile/src/components/LaneRow.tsx` | Lane progress bar (shared with Review/Today). |

## Data touched

- **`users/{uid}/domains/{domainId}`** — `{ name, color, icon, weeklyTargetHours,
  order, archived }`. Created/edited/archived here. **Never deleted** — archive only,
  so past sessions keep resolving their lane.
- **`users/{uid}/weeks/{weekId}`** — `{ startsAt, targets:{domainId:hours},
  reflections, status }`. The week's plan snapshot.

## Flow

```
sign-in (first time) → bootstrapDomains → DEFAULT_DOMAINS written
useAppSync → observeDomains → ALL domains → store derives:
              domainsAll (everything)  +  domains (non-archived)
           → observeWeek → useApp.week; if null → ensureWeek()
Plan screen:
   ± stepper   → setDomainTarget(id, hours) → updateDomain(weeklyTargetHours)
   tap lane    → /lane/{id}  (editor modal)
   ＋ Add lane → /lane/new
Lane editor:
   save (new)  → addDomain({name,icon,color,weeklyTargetHours})
                 → order = max(ALL domains' order) + 1 → createDomain
   save (edit) → editDomain(id, patch) → updateDomain
   archive     → guard: lane owns activeSession? → blocked alert
               → confirm (warns if hours logged this week)
               → updateDomain {archived:true}
   total = Σ weeklyTargetHours; if > MAX_REASONABLE_WEEK_HOURS → right-sizing nudge
```

`ensureWeek()` runs when the current `weekId` has no doc yet and domains are loaded:
it snapshots `targets = {domainId: weeklyTargetHours}` for every domain and writes a
`weeks/{weekId}` doc with `status:"active"`.

## Features

- **Lane CRUD:** create (name/icon/color/target — defaults: next `laneColor`, first
  unused `LANE_ICONS` emoji, 5h), edit, and archive from the editor modal. Archive
  never deletes; archived lanes vanish from Plan/pickers but stay resolvable for
  history (see [weekly-review.md](weekly-review.md)).
- **Archive guards:** archiving the lane that owns the **active session** is blocked
  ("Lane is in use"); archiving a lane with logged hours this week warns that the
  hours remain in Review as history (`loggedHoursFor`).
- **Lanes from defaults:** new users get 5 starter lanes seeded on first login.
- **Edit target hours:** ± steppers adjust `weeklyTargetHours` (clamped ≥0),
  optimistic + Firestore write. Also editable in the lane editor.
- **Total + right-sizing nudge:** when total > `MAX_REASONABLE_WEEK_HOURS` (60h) the
  Plan screen shows a calm right-sizing message; 70% framing otherwise.
- **Sign out moved to Profile** (see [auth.md](auth.md)).

## ⚠️ Important nuance: targets snapshot vs. live targets

`week.targets` is **snapshotted once** by `ensureWeek` when the week is first seen.
But the **Review screen computes targets from the live `domains`**, not from
`week.targets`. So:
- Editing a lane's target **immediately** changes what Today/Review compare against.
- A lane **added mid-week** is not in `week.targets` — intentional and consistent
  (target edits don't update the snapshot either); it still appears in Review
  immediately because Review reads live domains.
- `week.targets` is stored for history but is **not** the current read path.

Decide intentionally if you change this. If you want "the plan is locked once the
week starts", switch Review to read `week.targets` and stop editing affecting the
current week — and update [weekly-review.md](weekly-review.md) + [data-firestore.md](data-firestore.md).

## Caveats / gotchas

- **`observeDomains` emits archived lanes too** — the store derives the active
  subset. UI that should hide archived lanes must read `useApp.domains`, not
  `domainsAll`. `domainById` deliberately searches `domainsAll` (history must
  resolve).
- **New-lane `order`** is computed over **all** lanes (incl. archived) so an archived
  lane's order can't collide with a new one.
- **`weekStartsOn` is now a real setting** (persisted, editable in Profile) — the
  week/session listeners re-key when it changes (see [data-firestore.md](data-firestore.md)).

## Known gaps

- Lane **reorder** UI (schema's `order` supports it; a drag library would pull in
  the reanimated/worklets lockstep — see [architecture.md](architecture.md) §3 — so
  deferred; up/down buttons in the editor are the cheap alternative).
- Unarchive UI (the doc flag flips one way today; archived lanes are recoverable
  only by hand).
- Plan locking (snapshot-based review).
- Per-day scheduling (budgets are weekly, not time-of-day).

---

## 📌 Keeping this doc in sync (read me, Claude)
Update this when you change lane management, the editor modal, target editing, the
right-sizing nudge, `ensureWeek`, or the `domains`/`weeks` shapes. Pay special
attention to the "targets snapshot vs. live targets" nuance — if you change which one
Review reads, update both docs. Full protocol in [README.md](README.md).
