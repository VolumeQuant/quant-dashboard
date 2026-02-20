/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          deep: "var(--surface-deep)",
          default: "var(--surface-default)",
          elevated: "var(--surface-elevated)",
          hover: "var(--surface-hover)",
          active: "var(--surface-active)",
        },
        border: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)",
        },
        signal: {
          green: "var(--signal-green)",
          red: "var(--signal-red)",
          amber: "var(--signal-amber)",
          blue: "var(--signal-blue)",
        },
      },
      fontFamily: {
        sans: ["Pretendard Variable", "Pretendard", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "Cascadia Code", "Source Code Pro", "monospace"],
      },
      maxWidth: {
        content: "1440px",
      },
    },
  },
  plugins: [],
};
