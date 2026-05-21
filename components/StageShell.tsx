/**
 * StageShell.tsx
 * Shared layout for stage score + feedback + next-stage CTA.
 */

"use client";

import { ScoreBadge } from "@/components/ScoreBadge";

type StageShellProps = {
  children: React.ReactNode;
  score?: number;
  feedback?: string;
  isLoading?: boolean;
  error?: string;
  canAdvance?: boolean;
  advanceLabel?: string;
  onAdvance?: () => void;
};

/**
 * Wraps stage content with scoring panel and next button.
 */
export function StageShell({
  children,
  score,
  feedback,
  isLoading = false,
  error,
  canAdvance = false,
  advanceLabel = "Next Stage",
  onAdvance,
}: StageShellProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-6 flex-1">
      {children}
      {isLoading && <p className="text-sm text-gray-500">Scoring your work...</p>}
      {error && (
        <p className="text-sm text-red-600 border border-red-200 rounded p-3">{error}</p>
      )}
      {score !== undefined && feedback && (
        <div className="border-t border-gray-200 pt-6 space-y-4">
          <ScoreBadge score={score} />
          <p className="text-sm text-gray-700 leading-relaxed">{feedback}</p>
          {canAdvance && onAdvance && (
            <button
              type="button"
              onClick={onAdvance}
              className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded"
            >
              {advanceLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
