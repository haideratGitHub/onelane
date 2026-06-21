/**
 * Single source of truth for site-wide SEO/identity constants.
 *
 * The canonical origin is read from NEXT_PUBLIC_SITE_URL so it can change per
 * deployment without touching code; it defaults to the production domain.
 * Everything that needs an absolute URL (metadataBase, canonical, sitemap,
 * robots, Open Graph, JSON-LD) derives from SITE_URL — keep it the only place
 * the domain is written.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://onelane.app"
).replace(/\/$/, "");

export const SITE_NAME = "onelane";

/** Tagline used in titles. */
export const SITE_TAGLINE = "Stay in one lane";

/** ~155-char meta description (single source for <meta> + OG + JSON-LD). */
export const SITE_DESCRIPTION =
  "onelane is a focus & accountability app for people running more than one serious thing. It protects single-tasking, captures distractions without acting on them, and turns your weekly plan into visible, sustainable progress.";

/** The three pillars — the phrases we want AI engines to associate with the brand. */
export const CORE_FEATURES = [
  "Single-tasking",
  "Distraction capture",
  "Closure",
] as const;

/** Store URLs — placeholders until the apps are live (see docs/aso.md). */
export const APP_STORE_URL = "#";
export const PLAY_STORE_URL = "#";

/**
 * Support / privacy contact. ⚠️ Must be a real, monitored inbox before launch —
 * the App Store and Google Play both require a working support contact, and the
 * privacy policy points here for data-rights requests.
 */
export const SUPPORT_EMAIL = "support@onelane.app";

/** Absolute URL helper. */
export const url = (path = "/") =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
