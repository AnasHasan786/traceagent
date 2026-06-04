import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body:    ["DM Sans", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },
      colors: {
        accent: {
          DEFAULT: "#f59e0b",
          bright:  "#fbbf24",
          dim:     "#d97706",
        },
        bg: {
          base:     "#0d0e11",
          surface:  "#13151a",
          elevated: "#1a1d24",
          overlay:  "#21252f",
        },
        border: {
          subtle:  "#1f2330",
          default: "#2a2f3d",
          strong:  "#3a4054",
        },
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      animation: {
        "fade-in":    "fadeIn 0.35s ease both",
        "slide-left": "slideInLeft 0.3s ease both",
        "spin-slow":  "spin 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)"   },
        },
        slideInLeft: {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to:   { opacity: "1", transform: "translateX(0)"     },
        },
      },
    },
  },
  plugins: [],
};

export default config;