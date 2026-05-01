import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          '"JetBrains Mono"',
          '"SFMono-Regular"',
          "monospace",
        ],
      },
      fontSize: {
        /**
         * Atlassian Design System (SKILL.md) — minor third; rem at 16px root.
         * Overrides default Tailwind `lg`+ so `text-lg` / `text-xl` / `text-2xl` match Jira.
         */
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.25rem", { lineHeight: "1.5rem" }],
        xl: ["1.5rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.8125rem", { lineHeight: "2rem" }],
        "3xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "4xl": ["2.8125rem", { lineHeight: "3rem" }],
        "ds-heading-xsmall": ["0.75rem", { lineHeight: "1rem", fontWeight: "600" }],
        "ds-heading-small": ["0.875rem", { lineHeight: "1rem", fontWeight: "600" }],
        "ds-heading-medium": ["1rem", { lineHeight: "1.25rem", fontWeight: "600" }],
        "ds-heading-large": ["1.25rem", { lineHeight: "1.5rem", fontWeight: "600" }],
        "ds-heading-xlarge": ["1.5rem", { lineHeight: "1.75rem", fontWeight: "600" }],
        "ds-heading-xxlarge": ["1.8125rem", { lineHeight: "2rem", fontWeight: "600" }],
        "ds-body": ["0.875rem", { lineHeight: "1.25rem", fontWeight: "400" }],
        "ds-body-large": ["1rem", { lineHeight: "1.5rem", fontWeight: "400" }],
        "ds-body-small": ["0.75rem", { lineHeight: "1rem", fontWeight: "400" }],
        "ds-code": ["0.75rem", { lineHeight: "1em", fontWeight: "400" }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        /** ADS: 4px inputs/buttons, 8px cards — shadcn maps lg/md/sm from --radius */
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        ds: "4px",
        "ds-card": "8px",
      },
      boxShadow: {
        "ds-raised": "0 1px 2px rgba(9, 30, 66, 0.12)",
        "ds-overlay":
          "0 4px 8px rgba(9, 30, 66, 0.15), 0 0 1px rgba(9, 30, 66, 0.2)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
