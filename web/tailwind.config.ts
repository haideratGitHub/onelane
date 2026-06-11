import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // onelane brand — calm, focused, "asphalt + lane markings"
        ink: "#0B0F14",
        asphalt: "#11161D",
        slate: "#1B2430",
        fog: "#9AA7B6",
        line: "#FACC15", // lane marking yellow
        // Per-domain lane identities (kept in sync with mobile DEFAULT_DOMAINS)
        lane: {
          office: "#3B82F6",
          trading: "#10B981",
          saas: "#8B5CF6",
          learning: "#F59E0B",
          gym: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "lane-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "lane-pulse": "lane-pulse 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
