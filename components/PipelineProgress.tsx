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
 * Chevron clip on the background layer only (text sits in an unclipped inner layer).
 */
function chevronShapeClass(index: number): string {
  const col = index % 3;
  if (col === 0) return "pipeline-chevron-first";
  if (col === 2) return "pipeline-chevron-last";
  return "pipeline-chevron-mid";
}

/**
 * Left inset so labels sit in the flat body of each flag, clear of the notch.
 */
function labelInsetClass(index: number): string {
  const col = index % 3;
  if (col === 0) return "pl-4 pr-7 sm:pl-5 sm:pr-9";
  if (col === 2) return "pl-14 pr-5 sm:pl-16 sm:pr-6";
  return "pl-14 pr-7 sm:pl-16 sm:pr-9";
}

function statusSurfaceClass(
  status: StageProgressItem["status"],
  allComplete: boolean
): string {
  const effective = allComplete ? "completed" : status;
  if (effective === "completed") {
    return "bg-gold/15 border border-gold/40";
  }
  if (effective === "current") {
    return "bg-accent/15 border border-accent/50 ring-2 ring-accent/30";
  }
  return "bg-surface border border-border";
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
      <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3 pl-1">
        Simulation pipeline
      </p>
      <div className="overflow-x-auto pb-1">
        <div className="grid grid-cols-3 gap-2 min-w-[680px] w-full sm:min-w-0 sm:w-full">
          {items.map((item, index) => {
            const effective = allComplete ? "completed" : item.status;
            const isLocked = effective === "locked";

            return (
              <div
                key={item.stage}
                className="relative min-h-[76px]"
                aria-current={!allComplete && item.status === "current" ? "step" : undefined}
              >
                <div
                  className={`absolute inset-0 transition-colors ${chevronShapeClass(index)} ${statusSurfaceClass(item.status, allComplete)}`}
                  aria-hidden
                />
                <div
                  className={`relative z-10 flex flex-col justify-center min-h-[76px] py-3 text-left ${labelInsetClass(index)} ${isLocked ? "text-text-secondary" : "text-primary"}`}
                >
                  <span className="text-[10px] uppercase tracking-wide text-text-secondary block">
                    Stage {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-text-primary leading-tight mt-0.5 block">
                    {item.label}
                  </span>
                  {(item.score !== undefined || allComplete) && item.score !== undefined && (
                    <span className="text-xs font-medium text-gold mt-1 block">{item.score}/100</span>
                  )}
                  {!allComplete && item.status === "current" && item.score === undefined && (
                    <span className="text-xs text-accent mt-1 font-medium block">In progress</span>
                  )}
                  {!allComplete && item.status === "locked" && (
                    <span className="text-xs text-pipeline-inactive mt-1 block">Not started</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
