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
| `web/app/page.tsx` | The whole page: all sections (server component) composing the animation + icon pieces. Includes the `Faq` section (renders `web/lib/faq.ts`). |
| `web/app/layout.tsx` | `<html>`, full metadata (canonical, OG/Twitter, robots, keywords), theme color, fonts, `globals.css`, and renders `<JsonLd />`. |
| `web/app/globals.css` | Tailwind layers + the dashed `.lane-markings` background utility. |
| `web/tailwind.config.ts` | Brand + lane color tokens, `lane-pulse` keyframe. |
| `web/components/motion.tsx` | **Client** animation primitives: `Reveal`, `Stagger`, `StaggerItem`, `Float`. |
| `web/components/LaneProgress.tsx` | **Client** hero/reward visual: lanes with bars that animate to value on scroll; lucide icons. |
| `web/components/PhoneMockups.tsx` | **Client** pure-CSS iPhone mockups (frame + Dynamic Island + status bar) rendering miniatures of the real app screens: `TodayPhone`, `FocusPhone`, `ReviewPhone`, `LockScreenPhone`. No image assets — same line/asphalt theme + lane palette. Used by the `LockScreenCapture` USP and the `Showcase` section. |
| `web/components/StoreButtons.tsx` | App Store + Google Play buttons (inline glyphs). Hrefs come from `web/lib/site.ts` (`APP_STORE_URL` / `PLAY_STORE_URL`, placeholder `"#"`). |
| `web/components/JsonLd.tsx` | **Server** component emitting schema.org JSON-LD (`@graph`: `Organization`, `WebSite`, `SoftwareApplication`, `FAQPage`). Rendered once in `layout.tsx`. |
| `web/lib/site.ts` | SEO single source of truth: `SITE_URL` (from `NEXT_PUBLIC_SITE_URL`, default `https://onelane.app`), name, description, core features, store URLs, `url()` helper. |
| `web/lib/faq.ts` | The `FAQS` array (answer-capsule Q&As). Feeds **both** the on-page `Faq` section and the `FAQPage` JSON-LD — edit once. |
| `web/components/ContentPage.tsx` | **Server** shell for static content pages (header that links home, titled article with "prose" child-selector styling, footer with Privacy/Support links). Used by the privacy + support pages. |
| `web/app/privacy/page.tsx` | `/privacy` — the Privacy Policy (required by both app stores). Honest draft reflecting the real data flow (Firebase Auth + Firestore, self-report data, Vercel analytics); links to `SUPPORT_EMAIL`. ⚠️ needs legal review + real inbox before launch. |
| `web/app/support/page.tsx` | `/support` — the support page (contact, bug/feature, account-deletion steps, links to FAQ + privacy). Required support URL for the stores. |

### SEO / AEO route files (Next.js file conventions — auto-served)

| File | Serves | Role |
|---|---|---|
| `web/app/sitemap.ts` | `/sitemap.xml` | XML sitemap (one entry today). |
| `web/app/robots.ts` | `/robots.txt` | Allows search **and** AI crawlers (GPTBot, PerplexityBot, ClaudeBot, Google-Extended, …); disallows `/api/`; links the sitemap. |
| `web/app/manifest.ts` | `/manifest.webmanifest` | PWA web app manifest (name, theme color, icon). |
| `web/app/icon.svg` | `/icon.svg` (favicon) | Brand mark (yellow square + lane bar). |
| `web/app/opengraph-image.tsx` | `/opengraph-image` | Generated 1200×630 OG image via `next/og` (no binary asset). |
| `web/app/twitter-image.tsx` | `/twitter-image` | Re-exports the OG image for the Twitter card. |
| `web/public/llms.txt` | `/llms.txt` | Plain-text brand/feature summary for LLM crawlers (low-impact but cheap; keep in sync with the copy). |

## Page structure (`page.tsx`)

`Header → Hero → Problem → Wedge → LockScreenCapture → HowItWorks → Showcase →
Audience → Reward → Philosophy → Faq → FinalCta → Footer`. Each content section is
wrapped in `Reveal`/`Stagger` for scroll-in animation. Copy mirrors the product brief;
the "wedge" section is the positioning ("Not another time tracker" — single-tasking +
capture + closure). The `Faq` section renders `web/lib/faq.ts` as always-visible Q&A
(no collapse) so crawlers and AI answer engines get the full text.

- **`LockScreenCapture`** — the headline USP spotlight (2-col, like `Reward`): copy +
  a `LockScreenPhone` mockup showing onelane's lock-screen notification with its
  **"＋ Park a thought" text action open**. Sells "park a distraction without
  unlocking your phone / leaving your lane" (the `expo-notifications` text-input
  action — see [notifications.md](notifications.md) / [focus-session.md](focus-session.md)).
- **`Showcase`** ("A look inside") — a responsive 3-up of `TodayPhone` / `FocusPhone` /
  `ReviewPhone` mockups with captions, giving a rough feel of the real UX.

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

- **`LockScreenPhone`** animates its notification card in (`whileInView`, once); the
  `LockScreenCapture` section also wraps it in `Float` for a gentle bob.

**RSC boundary:** `page.tsx` is a server component. Anything using framer-motion must
be a client component — that's why `motion.tsx`, `LaneProgress.tsx`, and
`PhoneMockups.tsx` start with `"use client"`. lucide icons and `StoreButtons` render
fine on the server. If you add new animation directly in `page.tsx`, move it into a
client component instead.

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

## SEO & AEO (search + AI answer engines)

The page is optimized to rank for "onelane" (and focus/single-tasking terms) **and**
to be cited by AI answer engines (ChatGPT, Perplexity, Google AI Overviews). What's in
place:

- **Metadata** (`layout.tsx`): `metadataBase`, self-referencing **canonical**, a title
  `template`, expanded `keywords` (brand-first), full Open Graph + Twitter cards (with
  the generated OG image), and `robots` directives (`max-image-preview:large`). All
  absolute URLs derive from `SITE_URL` in `web/lib/site.ts`.
- **Structured data** (`components/JsonLd.tsx`): one JSON-LD `@graph` with
  `Organization`, `WebSite`, `SoftwareApplication` (the product — featureList, free
  offer, iOS/Android), and `FAQPage`. Validate changes with Google's Rich Results Test.
- **FAQ** (`web/lib/faq.ts` → on-page `Faq` + `FAQPage` schema): answer-capsule Q&As
  ("What is onelane?", "What problem does it solve?", "What are the core features?",
  "How is it different from a time tracker?", …) — the load-bearing AEO content. The
  array feeds the visible section **and** the schema, so they never drift.
- **Crawl/discovery**: `sitemap.ts`, `robots.ts` (explicitly allows the major AI bots),
  `manifest.ts`, `icon.svg`, `public/llms.txt`.

**Conventions to keep:** edit FAQ in `web/lib/faq.ts` only (both worlds update);
the domain lives once in `SITE_URL` (env `NEXT_PUBLIC_SITE_URL`, default
`https://onelane.app`) — set it in Vercel if the domain changes; keep the JSON-LD
facts and `llms.txt` in sync with the marketing copy. Store-listing optimization
(Apple/Google) is a separate doc: [aso.md](aso.md).

## Build / deploy / verify

```bash
cd web
npm install
npm run dev          # http://localhost:3000
npm run typecheck
npm run build        # static; current page first-load ~142 kB JS
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

- Real store links + (ideally) official store badges. URLs are centralized as
  `APP_STORE_URL` / `PLAY_STORE_URL` in `web/lib/site.ts` (currently `"#"`).
- App preview is **CSS mockups** (`PhoneMockups.tsx`), not real device screenshots —
  faithful to the screens but hand-built; swap for actual captures when there are
  store-quality ones. Keep the mockup copy/state in sync if the app screens change.
- **Privacy / support pages exist** (`/privacy`, `/support`, in the sitemap) but the
  Privacy Policy is a **draft that needs legal review**, and `SUPPORT_EMAIL` in
  `web/lib/site.ts` (`support@onelane.app`) must be pointed at a **real, monitored
  inbox** before store submission. (Also tracked in [aso.md](aso.md).)
- Analytics: Vercel Web Analytics is wired (`<Analytics />` in `layout.tsx`); no
  search-specific analytics (Google Search Console / Bing Webmaster) verified yet —
  add the verification `<meta>` (or DNS) and submit the sitemap after deploy.

---

## 📌 Keeping this doc in sync (read me, Claude)
Update this when you change the landing sections, animations, icons, store buttons,
theme tokens, or the build/deploy setup. If you ever re-add a backend (forms,
analytics), document it and the env it needs. Keep the RSC/client boundary note
accurate. Full protocol in [README.md](README.md).
