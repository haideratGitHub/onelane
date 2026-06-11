# onelane — Module Documentation

These docs are **module-by-module sources of truth**. Each file is written so that
attaching it alone gives a person (or Claude) full context to work on that module —
the cross-frontend/backend flow, the data it touches, every feature, the caveats,
and how to change it without causing regressions.

> There is **no custom backend server**. "Backend" = Firebase (Auth + Firestore)
> accessed directly from the app via the React Native Firebase SDK, with Firestore
> **security rules** as the authorization layer. So "endpoints" in these docs means
> the **repository functions** in `mobile/src/firebase/repositories.ts` plus the
> Firestore reads/writes/listeners they perform.

## Index

| Doc | Module | Read this when you're touching… |
|---|---|---|
| [architecture.md](architecture.md) | System foundation | Anything cross-cutting: structure, stack, data conventions, state/sync, navigation |
| [domain-model.md](domain-model.md) | Pure core logic | Timer/week/streak/review math (`mobile/src/domain/`) |
| [auth.md](auth.md) | Authentication | Sign-in, Google → Firebase, first-login bootstrap, sign-out, the auth gate |
| [data-firestore.md](data-firestore.md) | Data layer | Firestore schema, repositories, security rules, the live-sync engine |
| [focus-session.md](focus-session.md) | Focus session (core loop) | Starting/timing/pausing/closing a block, the timer, the yak-shave guard |
| [parking-lot.md](parking-lot.md) | Distraction capture | The quick-capture sheet and triage list |
| [weekly-plan.md](weekly-plan.md) | Plan / lanes | Domains (lanes), weekly hour budgets, right-sizing |
| [weekly-review.md](weekly-review.md) | Weekly review | Planned-vs-actual, reflections, streaks |
| [notifications.md](notifications.md) | Notifications | `expo-notifications` scheduling, check-ins, quiet hours |
| [landing-page.md](landing-page.md) | Marketing site (`web/`) | The Next.js landing page, animations, store CTAs |

Start with **architecture.md** if you're new; it explains the conventions every
other doc assumes (especially the epoch-millisecond timestamps and the
timestamp-based timer).

---

## 📌 Documentation maintenance protocol (read me, Claude)

**These docs must never drift from the code.** When you change the implementation,
update the relevant doc(s) **in the same change set** — not later. This is a hard
requirement, treated with the same seriousness as updating tests.

When you modify a module, before you finish:

1. **Open the matching `docs/*.md`** for every module your change touches.
2. Update each of these sections if affected:
   - **Files** — added/removed/renamed files, functions, screens, or routes.
   - **Data model** — any new/changed/removed Firestore collection, field, or domain type. Keep field names and types exact.
   - **Flow** — any change to the end-to-end sequence (UI → store → Firestore and back).
   - **Features** — new behavior, changed behavior, or removed behavior, and *how it works*.
   - **Caveats / gotchas** — anything non-obvious you discovered or introduced, and any regression risk. If you hit a bug, record the cause so the next person doesn't repeat it.
   - **Known gaps / TODO** — promote anything you finished out of this list; add anything you deferred.
3. Keep **file paths and function signatures exact** — they are load-bearing; people grep for them.
4. If a change spans modules, update **every** affected module doc **and**
   `architecture.md` if a cross-cutting convention changed.
5. If you add a whole new module, create a new `docs/<module>.md` from the shared
   structure (Purpose → Files → Data model → Flow → Features → Caveats → Known gaps
   → maintenance footer) and add a row to the table above.

A change is not complete until its docs are updated. If you are asked to make a
change and you can see the docs are already stale, fix the staleness as part of the
work and call it out.
