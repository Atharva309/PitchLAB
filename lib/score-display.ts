/**
 * score-display.ts
 * Score color helpers for results UI (gold / accent / error from design tokens).
 */

import { GRADE_B_MIN, GRADE_D_MIN, MAX_STAGE_SCORE } from "@/lib/constants";

export type ScoreTone = "gold" | "accent" | "error";

/**
 * Maps a stage score (0–100) to a display tone for Stitch results styling.
 */
export function stageScoreTone(score: number): ScoreTone {
  if (score >= 80) return "gold";
  if (score >= 60) return "accent";
  return "error";
}

/**
 * Maps total simulation score to a display tone.
 */
export function totalScoreTone(totalScore: number): ScoreTone {
  if (totalScore >= GRADE_B_MIN) return "gold";
  if (totalScore >= GRADE_D_MIN) return "accent";
  return "error";
}

/**
 * Tailwind text color class for a score tone (no hardcoded hex in components).
 */
export function toneTextClass(tone: ScoreTone): string {
  if (tone === "gold") return "text-gold";
  if (tone === "accent") return "text-accent";
  return "text-error";
}

/**
 * Tailwind background class for score highlight blocks.
 */
export function toneBgClass(tone: ScoreTone): string {
  if (tone === "gold") return "bg-gold/10 border-gold/30";
  if (tone === "accent") return "bg-accent/10 border-accent/30";
  return "bg-error/10 border-error/30";
}

/**
 * Normalizes stage score for display.
 */
export function formatStageScore(score: number | undefined): string {
  if (score === undefined) return "—";
  return `${score}/${MAX_STAGE_SCORE}`;
}
