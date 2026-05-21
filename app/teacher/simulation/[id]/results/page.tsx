/**
 * simulation/[id]/results/page.tsx — teacher
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { TeacherResultsClient } from "@/components/TeacherResultsClient";
import { buildLeaderboard } from "@/lib/leaderboard";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth-helpers";

type PageProps = { params: { id: string } };

/**
 * Teacher view of student attempts and leaderboard.
 */
export default async function TeacherResultsPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  await requireRole("teacher");
  const supabase = createClient();

  const { data: simulation } = await supabase
    .from("simulations")
    .select("title")
    .eq("id", params.id)
    .single();

  if (!simulation) redirect("/teacher/dashboard");

  const { data: attempts } = await supabase
    .from("attempts")
    .select("*, profiles(full_name), stage_scores(*)")
    .eq("simulation_id", params.id)
    .order("started_at", { ascending: false });

  const { data: completed } = await supabase
    .from("attempts")
    .select("id, student_id, total_score, profiles(full_name)")
    .eq("simulation_id", params.id)
    .eq("status", "completed")
    .order("total_score", { ascending: false });

  const leaderboard = buildLeaderboard(
    (completed ?? []) as Parameters<typeof buildLeaderboard>[0]
  );

  return (
    <div>
      <Link href="/teacher/dashboard" className="text-sm text-gray-500 underline">
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-4">{simulation.title} — Results</h1>
      <div className="mt-8">
        <TeacherResultsClient
          attempts={(attempts ?? []) as Parameters<typeof TeacherResultsClient>[0]["attempts"]}
          leaderboard={leaderboard}
        />
      </div>
    </div>
  );
}
