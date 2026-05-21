/**
 * CompletedStagesPanel.tsx
 * Shows stages the student has already completed with scores and feedback.
 */

"use client";

import { SCORED_STAGES, STAGE_LABELS } from "@/lib/constants";
import type { SimulationStage, StageScore } from "@/types";

type CompletedStagesPanelProps = {
  stageScores: StageScore[];
  currentStage: SimulationStage;
};

/**
 * Lists completed stages so the student can review prior work during the attempt.
 */
export function CompletedStagesPanel({
  stageScores,
  currentStage,
}: CompletedStagesPanelProps): React.ReactElement {
  const completed = SCORED_STAGES.filter((stage) => {
    const row = stageScores.find((s) => s.stage === stage);
    return row !== undefined && stage !== currentStage;
  });

  if (completed.length === 0) {
    return (
      <p className="text-xs text-gray-500 mb-4">No completed stages yet.</p>
    );
  }

  return (
    <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
        Completed stages
      </p>
      <ul className="space-y-3">
        {completed.map((stage) => {
          const row = stageScores.find((s) => s.stage === stage);
          if (!row) return null;
          return (
            <li key={stage} className="text-sm border-b border-gray-200 pb-2 last:border-0">
              <div className="flex justify-between font-medium text-gray-900">
                <span>{STAGE_LABELS[stage]}</span>
                <span>{row.score}/100</span>
              </div>
              {row.feedback && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-3">{row.feedback}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
