import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        sand: "#f6f0e8",
        ochre: "#c78b4d",
        sage: "#a8b19d",
        ink: "#2f2a25",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 25px rgba(199, 139, 77, 0.35)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "slow-spin": "spin 30s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
