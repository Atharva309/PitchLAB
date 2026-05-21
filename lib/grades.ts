/**
 * grades.ts
 * Letter grade helpers from total simulation score (max 600).
 */

import {
  GRADE_A_MIN,
  GRADE_B_MIN,
  GRADE_C_MIN,
  GRADE_D_MIN,
  MAX_TOTAL_SCORE,
} from "@/lib/constants";

/**
 * Converts a total score (0–600) to a letter grade.
 */
export function scoreToGrade(totalScore: number): string {
  if (totalScore >= GRADE_A_MIN) return "A";
  if (totalScore >= GRADE_B_MIN) return "B";
  if (totalScore >= GRADE_C_MIN) return "C";
  if (totalScore >= GRADE_D_MIN) return "D";
  return "F";
}

/**
 * Returns percentage of max total score for display.
 */
export function scorePercent(totalScore: number): number {
  return Math.round((totalScore / MAX_TOTAL_SCORE) * 100);
}
