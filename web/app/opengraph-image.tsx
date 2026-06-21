import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

/**
 * Generated social-share image (1200×630), served at /opengraph-image and wired
 * into og:image / twitter:image automatically by Next.js. Built with next/og so
 * there's no binary asset to maintain — it renders the brand mark, tagline, and
 * the three pillars on the app's "asphalt + lane marking" palette.
 *
 * Twitter reuses this via app/twitter-image.tsx.
 */
export const alt =
  "onelane — stay in one lane. Single-tasking, distraction capture, and closure.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0B0F14";
const ASPHALT = "#11161D";
const LINE = "#FACC15";
const FOG = "#9AA7B6";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: INK,
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* brand mark + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 16,
              background: LINE,
            }}
          >
            <div
              style={{ width: 10, height: 32, borderRadius: 6, background: INK }}
            />
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, color: "white" }}>
            {SITE_NAME}
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 88,
              fontWeight: 800,
              color: "white",
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            <span>Stay in&nbsp;</span>
            <span style={{ color: LINE }}>one lane.</span>
          </div>
          <div style={{ fontSize: 34, color: FOG, maxWidth: 900, lineHeight: 1.35 }}>
            Protect single-tasking. Capture distractions without chasing them.
            Turn your weekly plan into visible progress.
          </div>
        </div>

        {/* three pillars */}
        <div style={{ display: "flex", gap: 16 }}>
          {["Single-tasking", "Distraction capture", "Closure"].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: ASPHALT,
                border: `1px solid ${LINE}33`,
                borderRadius: 16,
                padding: "16px 24px",
                fontSize: 28,
                color: "white",
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  background: LINE,
                }}
              />
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
