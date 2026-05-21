/**
 * complete/page.tsx — student results
 * Stage score table, total grade, and simulation leaderboard.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { Leaderboard } from "@/components/Leaderboard";
import { ScoreBadge } from "@/components/ScoreBadge";
import { STAGE_LABELS } from "@/lib/constants";
import { scoreToGrade } from "@/lib/grades";
import { buildLeaderboard } from "@/lib/leaderboard";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth-helpers";
import { SCORED_STAGES } from "@/lib/constants";
import type { StageScore } from "@/types";

type PageProps = {
  params: { id: string };
  searchParams: { attempt?: string };
};

/**
 * Results summary after all stages complete.
 */
export default async function SimulationCompletePage({
  params,
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const profile = await requireRole("student");
  const supabase = createClient();

  const attemptId = searchParams.attempt;
  if (!attemptId) redirect("/student/dashboard");

  const { data: attempt } = await supabase
    .from("attempts")
    .select("*, simulations(title)")
    .eq("id", attemptId)
    .eq("student_id", profile.id)
    .single();

  if (!attempt) redirect("/student/dashboard");

  const { data: stageScores } = await supabase
    .from("stage_scores")
    .select("*")
    .eq("attempt_id", attemptId)
    .order("completed_at");

  const scores = (stageScores ?? []) as StageScore[];
  const total = attempt.total_score as number;
  const grade = scoreToGrade(total);

  const { data: leaderboardRows } = await supabase
    .from("attempts")
    .select("id, student_id, total_score, profiles(full_name)")
    .eq("simulation_id", params.id)
    .eq("status", "completed")
    .order("total_score", { ascending: false });

  const leaderboard = buildLeaderboard(
    (leaderboardRows ?? []) as Parameters<typeof buildLeaderboard>[0]
  );

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Results</h1>
      <p className="text-sm text-gray-500 mt-1">
        {(attempt.simulations as { title: string })?.title ?? "Simulation"}
      </p>

      <div className="mt-8">
        <p className="text-5xl font-bold text-gray-900">{total}</p>
        <p className="text-gray-500 text-sm">out of 600</p>
        <p className="text-xl font-semibold mt-2">Grade: {grade}</p>
      </div>

      <table className="w-full mt-8 text-sm border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="px-4 py-3">Stage</th>
            <th className="px-4 py-3">Score</th>
            <th className="px-4 py-3">Feedback</th>
          </tr>
        </thead>
        <tbody>
          {SCORED_STAGES.map((stage) => {
            const row = scores.find((s) => s.stage === stage);
            return (
              <tr key={stage} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium">{STAGE_LABELS[stage]}</td>
                <td className="px-4 py-3">
                  {row ? <ScoreBadge score={row.score} /> : "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">{row?.feedback ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2 className="text-lg font-semibold mt-12 mb-4">Leaderboard</h2>
      <Leaderboard entries={leaderboard} highlightStudentId={profile.id} />

      <Link
        href="/student/dashboard"
        className="inline-block mt-8 px-5 py-2.5 border border-gray-300 rounded text-sm font-medium"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
