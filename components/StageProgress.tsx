/**
 * StageProgress.tsx
 * Left sidebar stage tracker for the student simulation flow.
 */

"use client";

import type { StageProgressItem } from "@/types";

type StageProgressProps = {
  items: StageProgressItem[];
};

/**
 * Renders stage progress list with completed / current / locked states.
 */
export function StageProgress({ items }: StageProgressProps): React.ReactElement {
  return (
    <nav className="w-56 shrink-0 border-r border-gray-200 pr-6">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Progress
      </p>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.stage} className="flex items-start gap-2 text-sm">
            <span
              className={
                item.status === "completed"
                  ? "text-green-600"
                  : item.status === "current"
                    ? "text-blue-600"
                    : "text-gray-300"
              }
            >
              {item.status === "completed" ? "●" : item.status === "current" ? "◉" : "○"}
            </span>
            <span
              className={
                item.status === "locked" ? "text-gray-400" : "text-gray-900 font-medium"
              }
            >
              {item.label}
              {item.score !== undefined && (
                <span className="block text-xs text-gray-500 font-normal">{item.score}/100</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </nav>
  );
}
