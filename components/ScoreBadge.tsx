/**
 * ScoreBadge.tsx
 * Displays numeric stage score with Stitch gold/accent/error tones.
 */

"use client";

import { scoreToGrade } from "@/lib/grades";
import { stageScoreTone, toneBgClass, toneTextClass } from "@/lib/score-display";

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
  const tone = stageScoreTone(score);

  return (
    <div className={`rounded-lg border p-4 ${toneBgClass(tone)}`}>
      <p className={`text-3xl font-bold ${toneTextClass(tone)}`}>{score}/100</p>
      {showGrade && grade && (
        <p className="text-sm text-text-secondary mt-1">
          Total grade: <span className="font-semibold text-text-primary">{grade}</span>
          {totalScore !== undefined && ` (${totalScore}/600)`}
        </p>
      )}
    </div>
  );
}
