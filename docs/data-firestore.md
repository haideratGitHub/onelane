# Data Layer — Firestore (the "backend")

There is no server. This module **is** the backend: the Firestore schema, the
repository functions that read/write/listen, the security rules that authorize
access, and the live-sync engine that feeds the UI.

## Files

| File | Role |
|---|---|
| `mobile/src/firebase/config.ts` | Env → `firebaseConfig` + `isFirebaseConfigured`. |
| `mobile/src/firebase/firebase.ts` | Initializes the **Firebase JS SDK** app from `EXPO_PUBLIC_FIREBASE_*` env (**only when configured** — exports are `null` otherwise); `db = initializeFirestore(app, {experimentalForceLongPolling:true})` and `fbAuth` (AsyncStorage persistence). |
| `mobile/src/firebase/demo.ts` | **Demo mode** in-memory backend (same observe/write contracts, seeded sample data) used when Firebase isn't configured. Every repository function short-circuits to it. |
| `mobile/src/firebase/paths.ts` | Collection/doc ref builders via modular `collection()`/`doc()` (the schema, in code). |
| `mobile/src/firebase/repositories.ts` | All reads/writes/listeners + `toDoc`/`fromDoc` (de)serialization. |
| `mobile/src/store/useApp.ts` | `useAppSync(uid)` attaches the listeners; actions call the repositories. |
| `mobile/firestore.rules` | Security rules (per-uid isolation). Deploy with the Firebase CLI. |

## Schema

All app data is **per-user**, nested under `users/{uid}`. Document data is the domain
object **minus its `id`** (the `id` is the doc id), with **all timestamps as epoch ms
numbers** (see [architecture.md](architecture.md) §5.1).

```
users/{uid}
  profile: { displayName, email, photoURL }
  settings: { weekStartsOn, timezone, quietHours:{start,end}, maxCheckinsPerDay, checkinStyle }   # partial OK — merged over DEFAULT_SETTINGS on read

users/{uid}/domains/{domainId}        # a lane
  { name, color, icon, weeklyTargetHours, order, archived }

users/{uid}/weeks/{weekId}            # weekId e.g. "2026-W24"
  { startsAt, targets: {domainId: hours}, reflections: [{prompt, answer}], status }

users/{uid}/sessions/{sessionId}      # a focus block
  { domainId, weekId, intendedOutcome, startAt, endAt|null,
    segments: [{start, end|null}], plannedDurationMin|null,
    status: "active"|"completed"|"abandoned", closureNote|null,
    checkins: [{at, prompt, response}] }

users/{uid}/parkingLot/{itemId}       # a captured distraction
  { text, createdAt, originSessionId|null, domainId|null,
    status: "open"|"done"|"promoted"|"dismissed" }
```

Field-level meaning lives in [domain-model.md](domain-model.md) (the same shapes are
the domain types). Path builders are in `paths.ts`:
`userDoc`, `domainsCol`, `weeksCol`, `sessionsCol`, `parkingLotCol`.

## The "API" (repository functions)

These are the only place Firestore is touched. Signatures from
`mobile/src/firebase/repositories.ts`:

**Serialization helpers (internal):**
- `toDoc(obj)` → strips `id`. `fromDoc<T>(snap)` → `{ id: snap.id, ...snap.data() }`.
  Because the doc *is* the object minus id, these are the entire mapping layer.

**domains**
| Function | Kind | Effect |
|---|---|---|
| `bootstrapDomains(uid)` | write | Seeds `DEFAULT_DOMAINS` once (skips if any domain exists). Batch write. |
| `observeDomains(uid, cb)` | listen | `orderBy("order")`, emits **all** domains incl. archived (the store derives the active subset — archived lanes must stay resolvable for history). Returns unsub. |
| `createDomain(uid, data)` | write | New domain doc; returns its id. |
| `updateDomain(uid, id, patch)` | write | Partial update (used for `weeklyTargetHours`). |

**weeks**
| `observeWeek(uid, weekId, cb)` | listen | Emits `Week | null`. `null` when the doc doesn't exist (JS SDK: `snap.exists()` is a **method**). |
| `upsertWeek(uid, week)` | write | `set(..., {merge:true})` on `weeks/{week.id}`. |

**sessions**
| `newSessionId(uid)` | id | Pre-generates a Firestore id so a `Session` can be built locally first. |
| `createSession(uid, session)` | write | `set` (full). |
| `updateSession(uid, session)` | write | `set(..., {merge:true})`. |
| `observeActiveSession(uid, cb)` | listen | `where("status","==","active").limit(1)` → `Session | null`. **This is how the app knows the current active session.** |
| `observeSessionsForWeek(uid, weekId, cb)` | listen | `where("weekId","==",weekId)` → `Session[]`. Powers Today + Review. |

**parkingLot**
| `addParkingItem(uid, data)` | write | New item; returns id. |
| `updateParkingItem(uid, id, patch)` | write | Status changes. |
| `observeOpenParking(uid, cb)` | listen | `where("status","==","open")`, **sorted client-side** by `createdAt` desc. |

**user**
| `ensureUserDoc(uid, profile)` | write | `set({profile}, {merge:true})`. Called on sign-in. |
| `observeUserSettings(uid, cb)` | listen | `onSnapshot(userDoc)` → `mergeSettings(data().settings)` — always emits a complete `UserSettings` (missing doc/field/partial all safe). |
| `updateUserSettings(uid, patch)` | write | `set({settings: patch}, {merge:true})`. Callers send `quietHours` whole, never partial. |

## Live-sync engine

`useAppSync(uid)` (in `useApp.ts`, mounted by `app/(app)/_layout.tsx`) is **two
effects**:
- **Effect 1 — uid-scoped** (`[uid]`): attaches `observeUserSettings`,
  `observeDomains`, `observeActiveSession`, `observeOpenParking`.
- **Effect 2 — week-scoped** (`[uid, settings.weekStartsOn]`): computes
  `weekId = getWeekId(now, weekStartsOn)`, hydrates the store, attaches
  `observeWeek` + `observeSessionsForWeek`. Changing the week start in Profile
  re-keys just these two listeners for the new weekId.
- On `observeWeek` returning `null`, calls `ensureWeek()` to snapshot the current
  week doc from the live domains' targets.
- ⚠️ The `weekStartsOn` dependency is a **primitive** Zustand selector — load-bearing.
  Snapshot emits create new `settings` objects every time; depending on the object
  would re-run Effect 2 on every settings write (and looping the settings observer
  if it ever moved there). Keep it a primitive.

Writes are **optimistic**: actions update the Zustand store immediately *and* call a
repository write; the `onSnapshot` listener then reconciles with the server copy.

## Security rules (`mobile/firestore.rules`)

- `users/{uid}` and everything under it: read/write **only** if
  `request.auth.uid == uid`. (One nested wildcard rule covers all subcollections.)
- `waitlist/{doc}`: `create` allowed, read/update/delete denied. **Legacy** — the
  landing page no longer writes a waitlist; this rule is harmless and can be removed.
- Deploy: `firebase deploy --only firestore:rules`.

## Indexes

Current queries are all **single-field** equality/`orderBy`, which Firestore serves
with automatic single-field indexes — **no composite index needed**. ⚠️ If you add a
query that **combines** a `where` with an `orderBy` on a different field (e.g.
`where("weekId",...).orderBy("startAt")`), Firestore will require a **composite
index**; create it from the console link in the thrown error, and note it here.

## Caveats / gotchas

- **Demo-mode delegation**: every repository function starts with
  `if (!isFirebaseConfigured) return demo.…`. If you add a repository function, add
  its demo counterpart in `demo.ts` too — otherwise demo mode crashes on that path.
  `paths.ts` uses `db!` on the assumption it's only reached when configured; keep the
  demo short-circuit **before** any `paths.ts` call.

- **Client timestamps, not `serverTimestamp()`.** Intentional. Don't "fix" this by
  switching to server timestamps — it would break the offline-first, epoch-ms model
  and the timer math.
- **Firebase JS SDK (modular) API** — the app uses the modular API, not RN Firebase's
  namespaced one: `snap.exists()` is a **method**; batches are `writeBatch(db)` (then
  `batch.set(doc(col), data)`); refs are built with `collection(db, …)` / `doc(col[, id])`
  in `paths.ts`; reads/writes use `getDocs(query(...))`, `setDoc`, `updateDoc`,
  `onSnapshot(query(...))`. New doc id: `doc(col).id`.
- **`observeActiveSession` assumes ≤1 active session.** If two ever exist, `limit(1)`
  silently picks one. Preserve the single-active invariant (see [focus-session.md](focus-session.md)).
- **`merge:true` writes** never delete fields. Removing a field from an entity won't
  remove it from existing docs — write a migration if needed.
- **`week.targets` is a snapshot** taken by `ensureWeek` when the week is first seen.
  The Review screen currently computes targets from **live domains**, not from
  `week.targets` — so the snapshot is stored but not the read path today. Don't
  assume `week.targets` drives the review (see [weekly-plan.md](weekly-plan.md) /
  [weekly-review.md](weekly-review.md)).
- **No on-disk offline persistence.** Unlike RN Firebase, the JS SDK on React Native
  uses an **in-memory cache only** (its IndexedDB persistence isn't available in RN).
  `firebase.ts` also forces **long polling** (`experimentalForceLongPolling:true`)
  because Firestore's WebChannel streaming is unreliable in RN/Expo Go — without it
  `onSnapshot` listeners can stall. `initializeFirestore`/`initializeAuth` are wrapped
  in try/catch (fall back to `getFirestore`/`getAuth`) so Fast Refresh is safe.

## Known gaps

- No data migration tooling; schema changes rely on `merge` + client tolerance.
- No pagination/retention on sessions (fine at personal scale).
- `promoted` parking status has no writer yet.
- ~~Settings are never persisted~~ — settings now live in `users/{uid}.settings`
  (Profile tab edits them; `mergeSettings` defends partial/missing data).

---

## 📌 Keeping this doc in sync (read me, Claude)
Update this whenever you change the Firestore schema, add/modify a repository
function, change a query (especially anything needing a composite index), or change
the security rules or the sync wiring. Keep collection paths, field names, and
function signatures exact. Full protocol in [README.md](README.md).
