/**
 * complete/page.tsx — student results
 * Pipeline (all complete), gold/blue/red scores, and leaderboard.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { PipelineProgress } from "@/components/PipelineProgress";
import { Leaderboard } from "@/components/Leaderboard";
import { STAGE_LABELS, SCORED_STAGES } from "@/lib/constants";
import { scoreToGrade } from "@/lib/grades";
import { buildLeaderboard } from "@/lib/leaderboard";
import { buildStageProgress } from "@/lib/stages";
import {
  stageScoreTone,
  toneBgClass,
  toneTextClass,
  totalScoreTone,
} from "@/lib/score-display";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth-helpers";
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
  const totalTone = totalScoreTone(total);

  const pipelineItems = buildStageProgress("results", scores);

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
    <div className="max-w-5xl w-full">
      <PipelineProgress items={pipelineItems} allComplete />

      <h1 className="text-2xl font-bold text-text-primary">Results</h1>
      <p className="text-sm text-text-secondary mt-1">
        {(attempt.simulations as { title: string })?.title ?? "Simulation"}
      </p>

      <div className={`mt-8 rounded-lg border p-6 ${toneBgClass(totalTone)}`}>
        <p className={`text-5xl font-bold ${toneTextClass(totalTone)}`}>{total}</p>
        <p className="text-text-secondary text-sm">out of 600</p>
        <p className="text-xl font-semibold mt-2 text-text-primary">
          Grade: <span className={toneTextClass(totalTone)}>{grade}</span>
        </p>
      </div>

      <div className="mt-8 card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-text-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Feedback</th>
            </tr>
          </thead>
          <tbody>
            {SCORED_STAGES.map((stage) => {
              const row = scores.find((s) => s.stage === stage);
              const tone = row ? stageScoreTone(row.score) : null;
              return (
                <tr key={stage} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {STAGE_LABELS[stage]}
                  </td>
                  <td className="px-4 py-3">
                    {row ? (
                      <span className={`font-semibold ${toneTextClass(tone!)}`}>
                        {row.score}/100
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{row?.feedback ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold text-text-primary mt-12 mb-4">Leaderboard</h2>
      <Leaderboard entries={leaderboard} highlightStudentId={profile.id} />

      <Link
        href="/student/dashboard"
        className="inline-block mt-8 px-5 py-2.5 border border-border rounded-md text-sm font-medium text-text-primary hover:bg-surface"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
