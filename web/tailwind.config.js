import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // Semantic tokens so pages stop hardcoding raw slate/indigo shades.
        canvas: "#070b16",
        surface: {
          DEFAULT: "#0e1626",
          raised: "#141d30",
        },
        brand: {
          DEFAULT: "#6366f1",
          soft: "#818cf8",
          deep: "#4f46e5",
        },
        positive: "#34d399",
        caution: "#fbbf24",
        negative: "#fb7185",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -12px rgba(0,0,0,0.6)",
        lift: "0 8px 30px -12px rgba(99,102,241,0.45)",
      },
      borderRadius: {
        xl2: "1.125rem",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        "fade-up": "fade-up 0.25s ease-out both",
      },
    },
  },
  plugins: [],
};
