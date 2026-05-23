/**
 * StageScoresSummary.tsx
 * Table of completed stage scores for the close stage (Stitch styling).
 */

"use client";

import { SCORED_STAGES, STAGE_LABELS } from "@/lib/constants";
import { scoreToGrade } from "@/lib/grades";
import { stageScoreTone, toneTextClass } from "@/lib/score-display";
import type { StageScore } from "@/types";

type StageScoresSummaryProps = {
  stageScores: StageScore[];
  runningTotal: number;
};

/**
 * Shows all scored stages completed so far in the attempt.
 */
export function StageScoresSummary({
  stageScores,
  runningTotal,
}: StageScoresSummaryProps): React.ReactElement {
  const grade = scoreToGrade(runningTotal);

  return (
    <div className="card-surface overflow-hidden">
      <div className="bg-surface px-4 py-3 border-b border-border flex justify-between items-center">
        <p className="font-semibold text-text-primary">Your progress so far</p>
        <p className="text-sm text-text-secondary">
          {runningTotal}/600 · Grade{" "}
          <span className="font-bold text-gold">{grade}</span>
        </p>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-surface text-left text-text-secondary">
          <tr>
            <th className="px-4 py-2 font-medium">Stage</th>
            <th className="px-4 py-2 font-medium">Score</th>
            <th className="px-4 py-2 font-medium">Feedback</th>
          </tr>
        </thead>
        <tbody>
          {SCORED_STAGES.map((stage) => {
            const row = stageScores.find((s) => s.stage === stage);
            const tone = row ? stageScoreTone(row.score) : null;
            return (
              <tr key={stage} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-text-primary">{STAGE_LABELS[stage]}</td>
                <td className="px-4 py-3">
                  {row ? (
                    <span className={`font-semibold ${toneTextClass(tone!)}`}>
                      {row.score}/100
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-text-secondary">{row?.feedback ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
