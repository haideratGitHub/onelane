# Landing Page Module (`web/`)

The marketing site. A single animated page that explains what onelane does, who it's
for, and what's unique, and drives to the App Store / Google Play. The page itself is
**static, no waitlist** (we publish straight to the stores). Deploys to Vercel.

> The deployment also hosts the mobile app's **Google auth broker**
> (`web/app/api/auth/google/*` + `web/lib/auth-broker.ts`, using `firebase-admin`) —
> two server-side API routes, unrelated to the marketing page. That module is
> documented in [auth.md](auth.md); its env vars are in `web/.env.example`.

## Stack & files

Next.js 15 (App Router) + React 19, Tailwind v3, **framer-motion** (animations),
**lucide-react** (icons). **firebase-admin** is server-only, used by the auth
broker routes ([auth.md](auth.md)); the page itself has no Firebase.

| File | Role |
|---|---|
| `web/app/page.tsx` | The whole page: all sections (server component) composing the animation + icon pieces. |
| `web/app/layout.tsx` | `<html>`, metadata/OG/Twitter, theme color, fonts, `globals.css`. |
| `web/app/globals.css` | Tailwind layers + the dashed `.lane-markings` background utility. |
| `web/tailwind.config.ts` | Brand + lane color tokens, `lane-pulse` keyframe. |
| `web/components/motion.tsx` | **Client** animation primitives: `Reveal`, `Stagger`, `StaggerItem`, `Float`. |
| `web/components/LaneProgress.tsx` | **Client** hero/reward visual: lanes with bars that animate to value on scroll; lucide icons. |
| `web/components/StoreButtons.tsx` | App Store + Google Play buttons (inline glyphs; placeholder hrefs). |

## Page structure (`page.tsx`)

`Header → Hero → Problem → Wedge → HowItWorks → Audience → Reward → Philosophy →
FinalCta → Footer`. Each content section is wrapped in `Reveal`/`Stagger` for
scroll-in animation. Copy mirrors the product brief; the "wedge" section is the
positioning ("Not another time tracker" — single-tasking + capture + closure).

## Animations (framer-motion)

- **`Reveal`** — fade + slide-up once in view (`whileInView`, `once:true`). Used to
  reveal sections.
- **`Stagger` / `StaggerItem`** — children animate in sequence (hero lines, card
  grids, steps).
- **`Float`** — gentle perpetual bob on the hero's `LaneProgress` card.
- **`LaneProgress`** bars animate their `width` from 0 to the target % the first time
  they scroll into view (staggered per lane).
- Hero has a soft blurred glow (`bg-line/10 blur-[120px]`) and the badge uses the
  `lane-pulse` keyframe.

**RSC boundary:** `page.tsx` is a server component. Anything using framer-motion must
be a client component — that's why `motion.tsx` and `LaneProgress.tsx` start with
`"use client"`. lucide icons and `StoreButtons` render fine on the server. If you add
new animation directly in `page.tsx`, move it into a client component instead.

## Icons (lucide-react)

Replaced all emoji. Lane icons: Office→`Briefcase`, SaaS→`Rocket`,
Trading→`TrendingUp`, Learning→`GraduationCap`, Gym→`Dumbbell`, win→`Check`. Section
icons: `Shuffle`, `GitBranch`, `BatteryLow` (problem); `Target`, `Inbox`,
`CircleCheck` (wedge); `Check` (principles). Keep icons consistent with the
"line/asphalt" theme (thin line icons).

## Store CTAs (`StoreButtons.tsx`)

Two buttons with inline Apple-logo and play-triangle SVGs. **`APP_STORE_URL` and
`PLAY_STORE_URL` are `"#"` placeholders** — set the real store URLs before launch.
For store-guideline compliance, consider swapping these for the official Apple/Google
badge **image** assets.

## Fonts

The sans typeface is **Inter**, loaded in `layout.tsx` via `next/font/google` and
exposed as the `--font-sans` CSS variable on `<html>` (`inter.variable`).
`tailwind.config.ts` references that variable in `fontFamily.sans`
(`["var(--font-sans)", "system-ui", "sans-serif"]`), and Tailwind's preflight applies
it to `<html>`. **Both halves are required** — if `--font-sans` is ever undefined
again, the whole `font-family` stack becomes invalid at computed-value time and the
page silently falls back to the browser's default **serif**. To change the typeface,
swap the `next/font` import in `layout.tsx` (keep `variable: "--font-sans"`).

## Theme / colors

`web/tailwind.config.ts` defines `ink`, `asphalt`, `slate`, `fog`, brand `line`
(`#FACC15`), and the `lane.*` palette. **This palette is duplicated from the mobile
app** (`mobile/tailwind.config.js` / `mobile/src/theme.ts`). If you change a brand or
lane color, change it in both apps (see [architecture.md](architecture.md) §8). The
hardcoded "70%+" copy mirrors `WIN_THRESHOLD` in the mobile domain — update by hand
if the threshold changes.

## Build / deploy / verify

```bash
cd web
npm install
npm run dev          # http://localhost:3000
npm run typecheck
npm run build        # static; current page first-load ~140 kB JS
```
Deploy to Vercel (zero-config Next.js). The marketing page needs no env; the
**auth broker routes do** (`web/.env.example` → Vercel project env) — without
them the page still builds/serves fine and only `/api/auth/google/*` fails.

## Caveats / gotchas

- **No waitlist** anymore — the waitlist component was removed. The only backend
  in `web/` is the auth broker ([auth.md](auth.md)); keep the marketing page itself
  free of backend dependencies, and keep the broker **auth-only** (no app data —
  [architecture.md](architecture.md) §4).
- **Store URLs are placeholders.**
- **Client/server split** — keep motion in client components or the build breaks.
- **Color drift** — the lane/brand palette must stay in sync with mobile by hand.
- **Bundle size** — framer-motion is the main JS cost. If it grows, consider
  `LazyMotion` / reducing animated components.

## Known gaps

- Real store links + (ideally) official store badges.
- No screenshots/app preview imagery yet (placeholders are the `LaneProgress` mock).
- No privacy policy / support pages (the App Store requires a privacy policy URL).
- No analytics.

---

## 📌 Keeping this doc in sync (read me, Claude)
Update this when you change the landing sections, animations, icons, store buttons,
theme tokens, or the build/deploy setup. If you ever re-add a backend (forms,
analytics), document it and the env it needs. Keep the RSC/client boundary note
accurate. Full protocol in [README.md](README.md).
