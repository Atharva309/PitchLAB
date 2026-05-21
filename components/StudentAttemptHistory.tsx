/**
 * StudentAttemptHistory.tsx
 * Lists completed simulation attempts with scores on the student dashboard.
 */

"use client";

import Link from "next/link";
import { scoreToGrade } from "@/lib/grades";

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
      <p className="text-sm text-gray-500 border border-gray-200 rounded-lg py-8 text-center mt-8">
        No completed simulations yet. Finish a scenario to see your scores here.
      </p>
    );
  }

  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-gray-900">My completed simulations</h2>
      <p className="text-sm text-gray-500 mt-1">Review scores and feedback from past runs.</p>

      <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
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
              return (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{sim?.title ?? "Simulation"}</p>
                    <p className="text-xs text-gray-500">{sim?.persona_name}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{completedLabel}</td>
                  <td className="px-4 py-3">{row.total_score}/600</td>
                  <td className="px-4 py-3 font-medium">{scoreToGrade(row.total_score)}</td>
                  <td className="px-4 py-3 text-right">
                    {sim && (
                      <Link
                        href={`/student/simulation/${sim.id}/complete?attempt=${row.id}`}
                        className="text-gray-900 underline font-medium"
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
