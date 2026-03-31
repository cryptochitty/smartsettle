/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg:      "#050810",
        bg2:     "#080d1a",
        surface: "#0c1422",
        surface2:"#111c30",
        border:  "#1a2d4a",
        border2: "#243d5e",
        accent:  "#00e5a0",
        accent2: "#00c87a",
        cyan:    "#38bdf8",
        gold:    "#fbbf24",
        purple:  "#a78bfa",
        muted:   "#4a6080",
        muted2:  "#6b8aaa",
        white:   "#e8f4ff",
      },
      fontFamily: {
        sans:    ["Space Grotesk", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
        display: ["Fraunces", "serif"],
      },
      animation: {
        "fade-up":   "fadeUp .4s ease both",
        "fade-in":   "fadeIn .3s ease both",
        "spin-slow": "spin 2s linear infinite",
        "spin":      "spin .8s linear infinite",
      },
      keyframes: {
        fadeUp: { from: { opacity: 0, transform: "translateY(14px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        spin:   { to: { transform: "rotate(360deg)" } },
      },
      borderRadius: {
        "2xl": "18px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};
