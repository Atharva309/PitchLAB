/**
 * StageShell.tsx
 * Shared layout for stage score + feedback + next-stage CTA (Stitch styling).
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
    <div className="flex flex-col gap-6 flex-1 card-surface p-6">
      {children}
      {isLoading && (
        <p className="text-sm text-text-secondary animate-pulse">Scoring your work…</p>
      )}
      {error && (
        <p className="text-sm text-error border border-error/30 bg-error/5 rounded-md p-3">
          {error}
        </p>
      )}
      {score !== undefined && feedback && (
        <div className="border-t border-border pt-6 space-y-4">
          <ScoreBadge score={score} />
          <p className="text-sm text-text-secondary leading-relaxed">{feedback}</p>
          {canAdvance && onAdvance && (
            <button type="button" onClick={onAdvance} className="btn-accent">
              {advanceLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
