/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          primary: "var(--bg-primary)",
          card: "var(--bg-card)",
          hover: "var(--bg-hover)",
          elevated: "var(--bg-elevated)",
        },
        border: {
          DEFAULT: "var(--border-default)",
          hover: "var(--border-hover)",
        },
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
        },
        positive: "var(--positive)",
        negative: "var(--negative)",
        factor: {
          value: "var(--factor-value)",
          quality: "var(--factor-quality)",
          growth: "var(--factor-growth)",
          momentum: "var(--factor-momentum)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "Cascadia Code", "Source Code Pro", "monospace"],
      },
      maxWidth: {
        dashboard: "1280px",
      },
    },
  },
  plugins: [],
};
