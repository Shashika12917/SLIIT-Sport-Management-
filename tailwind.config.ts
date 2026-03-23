import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import daisyui from "daisyui";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  daisyui: {
    themes: [
      {
        sliit: {
          primary: "#3A9679", // teal
          "primary-content": "#0B1120",
          secondary: "#FABC60", // amber
          "secondary-content": "#0B1120",
          accent: "#E16262", // coral
          "accent-content": "#0B1120",
          neutral: "#11144C", // navy
          "neutral-content": "#F9FAFB",
          "base-100": "#F9FAFB",
          "base-200": "#E5E7EB",
          "base-300": "#D1D5DB",
          info: "#38BDF8",
          success: "#22C55E",
          warning: "#FACC15",
          error: "#EF4444",
        },
      },
      "light",
      "dark",
    ],
  },
  plugins: [tailwindcssAnimate, daisyui],
} satisfies Config;
