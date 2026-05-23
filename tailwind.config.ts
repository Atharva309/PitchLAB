import type { Config } from "tailwindcss";
import { COLORS, RADIUS } from "./lib/design-tokens";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: COLORS.primary,
        accent: COLORS.accent,
        gold: COLORS.gold,
        success: COLORS.success,
        error: COLORS.error,
        page: COLORS.background,
        surface: COLORS.surface,
        border: COLORS.border,
        "text-primary": COLORS.textPrimary,
        "text-secondary": COLORS.textSecondary,
        "call-background": COLORS.callBackground,
        "pipeline-complete": COLORS.pipelineComplete,
        "pipeline-active": COLORS.pipelineActive,
        "pipeline-inactive": COLORS.pipelineInactive,
      },
      borderRadius: {
        sm: RADIUS.sm,
        md: RADIUS.md,
        lg: RADIUS.lg,
        full: RADIUS.full,
      },
    },
  },
  plugins: [],
};

export default config;
