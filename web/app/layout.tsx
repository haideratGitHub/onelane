import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
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
  title: "onelane — stay in one lane",
  description:
    "A focus & accountability companion that protects single-tasking, captures distractions without acting on them, and turns your weekly plan into visible, sustainable progress.",
  keywords: [
    "focus app",
    "single-tasking",
    "time blocking",
    "deep work",
    "weekly planning",
    "anti-distraction",
    "productivity",
  ],
  openGraph: {
    title: "onelane — stay in one lane",
    description:
      "Protect single-tasking. Capture distractions without chasing them. Turn your weekly plan into visible, sustainable progress.",
    type: "website",
    siteName: "onelane",
  },
  twitter: {
    card: "summary_large_image",
    title: "onelane — stay in one lane",
    description:
      "Protect single-tasking. Capture distractions without chasing them. Turn your weekly plan into visible, sustainable progress.",
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
      <body>{children}</body>
    </html>
  );
}
