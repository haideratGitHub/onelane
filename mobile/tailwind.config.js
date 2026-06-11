/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#0B0F14",
        asphalt: "#11161D",
        slate: "#1B2430",
        fog: "#9AA7B6",
        line: "#FACC15",
        lane: {
          office: "#3B82F6",
          trading: "#10B981",
          saas: "#8B5CF6",
          learning: "#F59E0B",
          gym: "#EF4444",
        },
      },
    },
  },
  plugins: [],
};
