/**
 * stages.ts
 * Stage ordering and progress helpers for the simulation sidebar.
 */

import { STAGE_LABELS } from "@/lib/constants";
import type { SimulationStage, StageProgressItem, StageScore } from "@/types";
import { STAGE_ORDER } from "@/types";

const PLAYABLE_STAGES = STAGE_ORDER.filter((s) => s !== "results");

/**
 * Returns 1-based stage index and total playable stages (excludes results).
 */
export function getStageOrdinal(stage: SimulationStage): { index: number; total: number } {
  const index = (PLAYABLE_STAGES as SimulationStage[]).indexOf(stage);
  return {
    index: index >= 0 ? index + 1 : 1,
    total: PLAYABLE_STAGES.length,
  };
}

/**
 * Human-readable header for video call UI, e.g. "Discovery · Stage 3 of 6".
 */
export function getStageCallLabel(stage: SimulationStage): string {
  const { index, total } = getStageOrdinal(stage);
  return `${STAGE_LABELS[stage]} · Stage ${index} of ${total}`;
}

/**
 * Returns the next stage after the given one, or null if at results.
 */
export function getNextStage(stage: SimulationStage): SimulationStage | null {
  const index = STAGE_ORDER.indexOf(stage);
  if (index < 0 || index >= STAGE_ORDER.length - 1) {
    return null;
  }
  return STAGE_ORDER[index + 1];
}

/**
 * Builds sidebar progress items from current stage and completed scores.
 */
export function buildStageProgress(
  currentStage: SimulationStage,
  completedScores: StageScore[]
): StageProgressItem[] {
  const completedSet = new Set(completedScores.map((s) => s.stage));
  const scoreMap = new Map(completedScores.map((s) => [s.stage, s.score]));
  const currentIndex = STAGE_ORDER.indexOf(currentStage);

  return STAGE_ORDER.filter((s) => s !== "results").map((stage) => {
    const stageIndex = STAGE_ORDER.indexOf(stage);
    let status: StageProgressItem["status"] = "locked";
    if (completedSet.has(stage)) {
      status = "completed";
    } else if (stage === currentStage) {
      status = "current";
    } else if (stageIndex < currentIndex) {
      status = "completed";
    }

    return {
      stage,
      label: STAGE_LABELS[stage],
      status,
      score: scoreMap.get(stage),
    };
  });
}
