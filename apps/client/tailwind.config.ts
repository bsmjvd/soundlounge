import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "420px",
      },
      colors: {
        background: "rgb(var(--canvas-rgb) / <alpha-value>)",
        foreground: "rgb(var(--ink-rgb) / <alpha-value>)",

        canvas: "rgb(var(--canvas-rgb) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface-rgb) / <alpha-value>)",
          raised: "rgb(var(--surface-raised-rgb) / <alpha-value>)",
          overlay: "rgb(var(--surface-overlay-rgb) / <alpha-value>)",
          sunken: "rgb(var(--surface-sunken-rgb) / <alpha-value>)",
        },
        line: {
          DEFAULT: "rgb(var(--line-rgb) / <alpha-value>)",
          strong: "rgb(var(--line-strong-rgb) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink-rgb) / <alpha-value>)",
          secondary: "rgb(var(--ink-secondary-rgb) / <alpha-value>)",
          muted: "rgb(var(--ink-muted-rgb) / <alpha-value>)",
          subtle: "rgb(var(--ink-subtle-rgb) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          strong: "rgb(var(--accent-strong-rgb) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground-rgb) / <alpha-value>)",
        },
        ember: "rgb(var(--ember-rgb) / <alpha-value>)",
        positive: "rgb(var(--positive-rgb) / <alpha-value>)",
        warning: "rgb(var(--warning-rgb) / <alpha-value>)",
        danger: "rgb(var(--danger-rgb) / <alpha-value>)",
        like: "rgb(var(--like-rgb) / <alpha-value>)",

        lounge: {
          dark: "rgb(var(--canvas-rgb) / <alpha-value>)",
          card: "rgb(var(--surface-rgb) / <alpha-value>)",
          border: "rgb(var(--line-rgb) / <alpha-value>)",
          accent: "rgb(var(--accent-rgb) / <alpha-value>)",
          accentHover: "rgb(var(--accent-strong-rgb) / <alpha-value>)",
          highlight: "rgb(var(--accent-rgb) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      spacing: {
        "4.5": "1.125rem",
        "8.5": "2.125rem",
        "9.5": "2.375rem",
        "13": "3.25rem",
        "18": "4.5rem",
        "22": "5.5rem",
      },
      borderRadius: {
        card: "var(--radius-card)",
        control: "var(--radius-control)",
        pill: "9999px",
      },
      boxShadow: {
        panel: "0 18px 50px -24px rgb(0 0 0 / 0.8)",
        glow: "0 0 24px rgb(var(--accent-rgb) / 0.35)",
        "glow-soft": "0 0 12px rgb(var(--accent-rgb) / 0.22)",
        "inset-line": "inset 0 0 0 1px rgb(var(--line-rgb))",
      },
      transitionTimingFunction: {
        "out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "200ms",
        slow: "320ms",
      },
      keyframes: {
        "sound-wave-1": {
          "0%, 100%": { transform: "scaleY(0.45)" },
          "50%": { transform: "scaleY(1)" },
        },
        "sound-wave-2": {
          "0%, 100%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(0.5)" },
        },
        "sound-wave-3": {
          "0%, 100%": { transform: "scaleY(0.6)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        "sound-wave-1": "sound-wave-1 1s ease-in-out infinite",
        "sound-wave-2": "sound-wave-2 1.2s ease-in-out infinite",
        "sound-wave-3": "sound-wave-3 0.9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
