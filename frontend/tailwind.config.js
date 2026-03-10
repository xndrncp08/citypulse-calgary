/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
        mono: ["'DM Mono'", "monospace"],
      },
      colors: {
        surface: {
          DEFAULT: "#0f1117",
          1: "#161b27",
          2: "#1e2538",
        },
        border: {
          DEFAULT: "#2a3148",
          subtle: "#1e2538",
        },
        accent: {
          blue: "#3b7dd8",
          cyan: "#22d3ee",
          amber: "#f59e0b",
          red: "#ef4444",
          green: "#10b981",
        },
        text: {
          primary: "#e8eaf0",
          secondary: "#8892a4",
          tertiary: "#4f5b73",
        },
      },
      backgroundImage: {
        "grid-subtle":
          "linear-gradient(rgba(42,49,72,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(42,49,72,0.4) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "32px 32px",
      },
    },
  },
  plugins: [],
};
