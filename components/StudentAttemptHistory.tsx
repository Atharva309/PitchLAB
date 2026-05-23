/**
 * StudentAttemptHistory.tsx
 * Lists completed simulation attempts with scores on the student dashboard.
 */

"use client";

import Link from "next/link";
import { scoreToGrade } from "@/lib/grades";
import { totalScoreTone, toneTextClass } from "@/lib/score-display";

export type StudentAttemptRow = {
  id: string;
  total_score: number;
  completed_at: string | null;
  simulations: { id: string; title: string; persona_name: string } | null;
};

type StudentAttemptHistoryProps = {
  attempts: StudentAttemptRow[];
};

/**
 * Renders past completed simulations with links to full results.
 */
export function StudentAttemptHistory({
  attempts,
}: StudentAttemptHistoryProps): React.ReactElement {
  if (attempts.length === 0) {
    return (
      <p className="text-sm text-text-secondary card-surface py-8 text-center mt-8">
        No completed simulations yet. Finish a scenario to see your scores here.
      </p>
    );
  }

  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-text-primary">My completed simulations</h2>
      <p className="text-sm text-text-secondary mt-1">Review scores and feedback from past runs.</p>

      <div className="mt-4 card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-text-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">Simulation</th>
              <th className="px-4 py-3 font-medium">Completed</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Grade</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {attempts.map((row) => {
              const sim = row.simulations;
              const completedLabel = row.completed_at
                ? new Date(row.completed_at).toLocaleDateString()
                : "—";
              const tone = totalScoreTone(row.total_score);
              return (
                <tr key={row.id} className="border-t border-border hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{sim?.title ?? "Simulation"}</p>
                    <p className="text-xs text-text-secondary">{sim?.persona_name}</p>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{completedLabel}</td>
                  <td className="px-4 py-3">{row.total_score}/600</td>
                  <td className={`px-4 py-3 font-semibold ${toneTextClass(tone)}`}>
                    {scoreToGrade(row.total_score)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {sim && (
                      <Link
                        href={`/student/simulation/${sim.id}/complete?attempt=${row.id}`}
                        className="text-accent font-medium hover:underline"
                      >
                        View results
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
