import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/site";
import "./globals.css";

// Exposes the typeface as the `--font-sans` CSS variable that
// tailwind.config.ts references. Without this the var is undefined and the
// whole font-family stack is invalid, so the browser falls back to serif.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  // Resolves every relative URL below (canonical, OG, sitemap-linked) against
  // the real origin. Required for correct absolute URLs in OG/Twitter tags.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE.toLowerCase()}`,
    // Sub-pages set their own title; it becomes "X — onelane".
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "productivity",
  keywords: [
    "onelane",
    "onelane app",
    "focus app",
    "single-tasking app",
    "single tasking",
    "distraction capture",
    "deep work app",
    "anti-distraction app",
    "time blocking app",
    "weekly planning app",
    "accountability app",
    "productivity app",
    "focus and accountability",
    "stop task switching",
    "focus timer",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  // Self-referencing canonical — the single preferred URL for the homepage.
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE.toLowerCase()}`,
    description: SITE_DESCRIPTION,
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    // Image is provided by app/opengraph-image.tsx (generated at build time).
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE.toLowerCase()}`,
    description: SITE_DESCRIPTION,
    // Image is provided by app/twitter-image.tsx.
  },
  // Let well-behaved crawlers (Google, Bing) index fully, and explicitly allow
  // rich snippets. AI crawlers are governed by robots.ts, not here.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0F14",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <JsonLd />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
