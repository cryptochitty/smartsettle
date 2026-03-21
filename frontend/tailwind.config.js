/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg:      "#080c14",
        surface: "#0d1726",
        border:  "#1a2d4a",
        accent:  "#00e896",
        cyan:    "#00c8f0",
        gold:    "#f5c842",
        purple:  "#9b6fe8",
        muted:   "#4a6080",
      },
      fontFamily: {
        sans: ["Syne", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      animation: {
        "fade-up":   "fadeUp .4s ease both",
        "glow":      "glow 2s infinite",
        "spin-slow": "spin 2s linear infinite",
      },
      keyframes: {
        fadeUp: { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        glow:   { "0%,100%": { boxShadow: "0 0 12px #00e89640" }, "50%": { boxShadow: "0 0 28px #00e89680" } },
      },
    },
  },
  plugins: [],
};
