/**
 * TeacherResultsClient.tsx
 * Expandable attempt rows and leaderboard tab for teachers.
 */

"use client";

import { Fragment, useState } from "react";
import { Leaderboard } from "@/components/Leaderboard";
import { STAGE_LABELS } from "@/lib/constants";
import type { LeaderboardEntry, StageScore } from "@/types";
import { SCORED_STAGES } from "@/lib/constants";
import { scoreToGrade } from "@/lib/grades";

type AttemptRow = {
  id: string;
  student_id: string;
  total_score: number;
  status: string;
  started_at: string;
  profiles: { full_name: string } | null;
  stage_scores: StageScore[];
};

type TeacherResultsClientProps = {
  attempts: AttemptRow[];
  leaderboard: LeaderboardEntry[];
};

/**
 * Teacher results table with expandable stage detail.
 */
export function TeacherResultsClient({
  attempts,
  leaderboard,
}: TeacherResultsClientProps): React.ReactElement {
  const [tab, setTab] = useState<"attempts" | "leaderboard">("attempts");
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div>
      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <button
          type="button"
          onClick={() => setTab("attempts")}
          className={`pb-2 text-sm font-medium ${
            tab === "attempts" ? "border-b-2 border-gray-900" : "text-gray-500"
          }`}
        >
          Attempts
        </button>
        <button
          type="button"
          onClick={() => setTab("leaderboard")}
          className={`pb-2 text-sm font-medium ${
            tab === "leaderboard" ? "border-b-2 border-gray-900" : "text-gray-500"
          }`}
        >
          Leaderboard
        </button>
      </div>

      {tab === "leaderboard" ? (
        <Leaderboard entries={leaderboard} />
      ) : attempts.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No student attempts yet.</p>
      ) : (
        <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((row) => (
              <Fragment key={row.id}>
                <tr
                  key={row.id}
                  className="border-t border-gray-100 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                >
                  <td className="px-4 py-3">{row.profiles?.full_name ?? "—"}</td>
                  <td className="px-4 py-3">
                    {new Date(row.started_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{row.total_score}/600</td>
                  <td className="px-4 py-3">{scoreToGrade(row.total_score)}</td>
                  <td className="px-4 py-3 capitalize">{row.status.replace("_", " ")}</td>
                </tr>
                {expanded === row.id && (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 bg-gray-50">
                      <div className="space-y-3">
                        {SCORED_STAGES.map((stage) => {
                          const sc = row.stage_scores.find((s) => s.stage === stage);
                          return (
                            <div key={stage} className="text-xs">
                              <strong>{STAGE_LABELS[stage]}</strong>: {sc?.score ?? "—"}/100
                              {sc?.feedback && (
                                <p className="text-gray-600 mt-1">{sc.feedback}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
