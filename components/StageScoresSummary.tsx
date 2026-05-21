/**
 * StageScoresSummary.tsx
 * Table of completed stage scores and feedback for review stages (e.g. close).
 */

"use client";

import { SCORED_STAGES, STAGE_LABELS } from "@/lib/constants";
import { scoreToGrade } from "@/lib/grades";
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
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <p className="font-semibold text-gray-900">Your progress so far</p>
        <p className="text-sm text-gray-600">
          {runningTotal}/600 · Grade <span className="font-bold">{grade}</span>
        </p>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-gray-600">
          <tr>
            <th className="px-4 py-2 font-medium">Stage</th>
            <th className="px-4 py-2 font-medium">Score</th>
            <th className="px-4 py-2 font-medium">Feedback</th>
          </tr>
        </thead>
        <tbody>
          {SCORED_STAGES.map((stage) => {
            const row = stageScores.find((s) => s.stage === stage);
            return (
              <tr key={stage} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">{STAGE_LABELS[stage]}</td>
                <td className="px-4 py-3">{row ? `${row.score}/100` : "—"}</td>
                <td className="px-4 py-3 text-gray-600">{row?.feedback ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
