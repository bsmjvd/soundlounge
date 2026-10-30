import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        lounge: {
          dark: "#0b0d13",
          card: "#131722",
          border: "#1f2638",
          accent: "#6366f1",
          accentHover: "#4f46e5",
          highlight: "#38bdf8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
