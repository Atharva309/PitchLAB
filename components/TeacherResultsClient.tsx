/**
 * TeacherResultsClient.tsx
 * Expandable attempt rows and leaderboard tab (Stitch table styling).
 */

"use client";

import { Fragment, useState } from "react";
import { Leaderboard } from "@/components/Leaderboard";
import { STAGE_LABELS, SCORED_STAGES } from "@/lib/constants";
import { scoreToGrade } from "@/lib/grades";
import { stageScoreTone, toneTextClass } from "@/lib/score-display";
import type { LeaderboardEntry, StageScore } from "@/types";

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
      <div className="flex gap-6 border-b border-border mb-6">
        <button
          type="button"
          onClick={() => setTab("attempts")}
          className={`pb-2 text-sm font-medium ${
            tab === "attempts"
              ? "border-b-2 border-accent text-text-primary"
              : "text-text-secondary"
          }`}
        >
          Attempts
        </button>
        <button
          type="button"
          onClick={() => setTab("leaderboard")}
          className={`pb-2 text-sm font-medium ${
            tab === "leaderboard"
              ? "border-b-2 border-accent text-text-primary"
              : "text-text-secondary"
          }`}
        >
          Leaderboard
        </button>
      </div>

      {tab === "leaderboard" ? (
        <Leaderboard entries={leaderboard} />
      ) : attempts.length === 0 ? (
        <p className="text-text-secondary text-center py-12 card-surface">
          No student attempts yet.
        </p>
      ) : (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-text-secondary border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Started</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Grade</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((row) => (
                <Fragment key={row.id}>
                  <tr
                    className="border-t border-border cursor-pointer hover:bg-surface/80"
                    onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                  >
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {row.profiles?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {new Date(row.started_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{row.total_score}/600</td>
                    <td className="px-4 py-3 font-medium text-gold">
                      {scoreToGrade(row.total_score)}
                    </td>
                    <td className="px-4 py-3 capitalize text-text-secondary">
                      {row.status.replace("_", " ")}
                    </td>
                  </tr>
                  {expanded === row.id && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 bg-surface">
                        <div className="space-y-3">
                          {SCORED_STAGES.map((stage) => {
                            const sc = row.stage_scores.find((s) => s.stage === stage);
                            const tone = sc ? stageScoreTone(sc.score) : null;
                            return (
                              <div key={stage} className="text-xs">
                                <strong className="text-text-primary">
                                  {STAGE_LABELS[stage]}
                                </strong>
                                :{" "}
                                {sc ? (
                                  <span className={toneTextClass(tone!)}>{sc.score}/100</span>
                                ) : (
                                  "—"
                                )}
                                {sc?.feedback && (
                                  <p className="text-text-secondary mt-1">{sc.feedback}</p>
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
        </div>
      )}
    </div>
  );
}
