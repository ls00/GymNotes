import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#101010",
        rich: "#1A1A1A",
        surface: "#1A1A1A",
        muted: "#A3A3A3",
        brand: {
          DEFAULT: "#F5F5F5",
          muted: "#D4D4D4",
          line: "#3A3A3A",
        },
        border: {
          DEFAULT: "#3A3A3A",
          subtle: "#2A2A2A",
          active: "#F5F5F5",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-teko)", "Impact", "sans-serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
