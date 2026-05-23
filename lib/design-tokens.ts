/**
 * design-tokens.ts
 * Single source of truth for design tokens (Stitch export spec).
 * Every color, spacing, radius, and shadow used in the app comes from here.
 */

export const COLORS = {
  primary: "#1a1a2e",
  accent: "#4f8ef7",
  gold: "#c9a84c",
  success: "#22c55e",
  error: "#ef4444",
  background: "#ffffff",
  surface: "#f8fafc",
  border: "#e2e8f0",
  textPrimary: "#0f172a",
  textSecondary: "#64748b",
  callBackground: "#0a0a0a",
  pipelineComplete: "#c9a84c",
  pipelineActive: "#4f8ef7",
  pipelineInactive: "#94a3b8",
} as const;

export const SPACING = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  xxl: "48px",
} as const;

export const RADIUS = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  full: "9999px",
} as const;

export const SHADOWS = {
  card: "0 1px 3px 0 rgb(15 23 42 / 0.08), 0 1px 2px -1px rgb(15 23 42 / 0.08)",
  header: "0 1px 0 0 rgb(226 232 240 / 1)",
} as const;

export const TYPOGRAPHY = {
  fontFamily:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  pageTitle: "1.5rem",
  sectionTitle: "1.125rem",
  body: "0.875rem",
  caption: "0.75rem",
} as const;
