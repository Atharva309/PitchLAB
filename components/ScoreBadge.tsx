/**
 * ScoreBadge.tsx
 * Displays numeric stage score and optional letter grade.
 */

"use client";

import { scoreToGrade } from "@/lib/grades";

type ScoreBadgeProps = {
  score: number;
  showGrade?: boolean;
  totalScore?: number;
};

/**
 * Shows score out of 100 (and optional total grade).
 */
export function ScoreBadge({
  score,
  showGrade = false,
  totalScore,
}: ScoreBadgeProps): React.ReactElement {
  const grade = totalScore !== undefined ? scoreToGrade(totalScore) : null;

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <p className="text-3xl font-bold text-gray-900">{score}/100</p>
      {showGrade && grade && (
        <p className="text-sm text-gray-600 mt-1">
          Total grade: <span className="font-semibold">{grade}</span>
          {totalScore !== undefined && ` (${totalScore}/600)`}
        </p>
      )}
    </div>
  );
}
