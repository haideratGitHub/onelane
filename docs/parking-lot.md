# Parking Lot Module (distraction capture)

The 5-second "honor it without obeying it" capture. When an off-task impulse hits
during a focus block, you dump it and stay in the lane; you triage it later.

## Files

| File | Role |
|---|---|
| `mobile/app/capture.tsx` | Modal: a single text field → `parkDistraction(text)` → back. Reachable from Today and from the focus session. |
| `mobile/app/(app)/parking.tsx` | The triage list: open items with **Done** / **Dismiss** actions. |
| `mobile/app/(app)/index.tsx` | Today: a "＋ Park a thought" button + an "N parked items to triage" link. |
| `mobile/src/store/useApp.ts` | Actions `parkDistraction`, `resolveParking`; state `parking`. |
| `mobile/src/firebase/repositories.ts` | `addParkingItem`, `updateParkingItem`, `observeOpenParking`. |

## Data touched

**`users/{uid}/parkingLot/{itemId}`**:
`{ text, createdAt(ms), originSessionId|null, domainId|null, status }`,
status ∈ `"open" | "done" | "promoted" | "dismissed"`.

- `parkDistraction(text)` writes an `open` item, stamping `originSessionId` and
  `domainId` from the **current active session** if one is running (so you can later
  see which block a thought interrupted).
- `observeOpenParking` streams only `status=="open"`, sorted **client-side** by
  `createdAt` desc into `useApp.parking`.
- `resolveParking(id, status)` sets the item to `done` or `dismissed`.

## Flow

```
(focus session or Today) ──"Park a thought"──► /capture (modal)
     type → parkDistraction(text)  → addParkingItem(open) → Firestore
                                                  │ observeOpenParking
                                                  ▼
                                    useApp.parking (live)
     Today shows count → /parking → Done/Dismiss → resolveParking → leaves the open stream
```

## Features

- **Instant capture:** one field, autofocus, submit-on-return; designed to be under
  5 seconds so it never tempts you into actually doing the thing.
- **Context tagging:** parked items remember the session/domain they came from.
- **Triage list:** only open items show; resolving removes them from the live list.
- **Today integration:** the parked-count nudge keeps the lot from being forgotten.

## Caveats / gotchas

- **`promoted` status is defined but unused** — there's no "turn this into a focus
  session / plan it" action yet. If you add one, write `status:"promoted"` (and maybe
  pre-fill `/session/start` with the item text), then update this doc and
  [data-firestore.md](data-firestore.md).
- **Sorting is client-side** (not a Firestore `orderBy`) to avoid needing a composite
  index alongside the `status` filter. If you add server-side ordering, you'll need an
  index.
- **No edit/delete** — items are only resolved (done/dismissed), never hard-deleted.
- Capture works without an active session (from Today); then `originSessionId` /
  `domainId` are `null`.

## Known gaps

- No "promote to session/plan" flow.
- No grouping by domain or by origin session in the triage UI.
- No bulk actions.

---

## 📌 Keeping this doc in sync (read me, Claude)
Update this when you change capture, triage, the parking statuses, or the
`parkingLot` doc shape. If you implement `promoted`, document the writer and the UX.
Full protocol in [README.md](README.md).
