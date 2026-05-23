/**
 * PipelineProgress.tsx
 * Full-width 2×3 chevron pipeline for the student simulation flow (Stitch design).
 */

"use client";

import type { StageProgressItem } from "@/types";

type PipelineProgressProps = {
  items: StageProgressItem[];
  /** When true, all stages render as complete (e.g. results page). */
  allComplete?: boolean;
};

/**
 * Returns Tailwind classes for a pipeline card by status.
 */
function cardClasses(status: StageProgressItem["status"], allComplete: boolean): string {
  const effective = allComplete ? "completed" : status;
  const base =
    "pipeline-chevron relative flex flex-col justify-center min-h-[72px] pl-6 pr-4 py-3 text-left transition-colors";

  if (effective === "completed") {
    return `${base} bg-gold/15 border border-gold/40 text-primary`;
  }
  if (effective === "current") {
    return `${base} bg-accent/15 border border-accent/50 text-primary ring-2 ring-accent/30`;
  }
  return `${base} bg-surface border border-border text-text-secondary`;
}

/**
 * Chevron-style stage pipeline in a 2×3 grid with gold / blue / grey states.
 */
export function PipelineProgress({
  items,
  allComplete = false,
}: PipelineProgressProps): React.ReactElement {
  return (
    <div className="w-full mb-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
        Simulation pipeline
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0">
        {items.map((item, index) => (
          <div
            key={item.stage}
            className={cardClasses(item.status, allComplete)}
            aria-current={!allComplete && item.status === "current" ? "step" : undefined}
          >
            <span className="text-[10px] uppercase tracking-wide text-text-secondary">
              Stage {index + 1}
            </span>
            <span className="text-sm font-semibold text-text-primary leading-tight mt-0.5">
              {item.label}
            </span>
            {(item.score !== undefined || allComplete) && item.score !== undefined && (
              <span className="text-xs font-medium text-gold mt-1">{item.score}/100</span>
            )}
            {!allComplete && item.status === "current" && item.score === undefined && (
              <span className="text-xs text-accent mt-1 font-medium">In progress</span>
            )}
            {!allComplete && item.status === "locked" && (
              <span className="text-xs text-pipeline-inactive mt-1">Not started</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
