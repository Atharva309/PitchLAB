/**
 * simulation/[id]/page.tsx — student
 * Starts or resumes an attempt and renders SimulationRunner.
 */

import { redirect } from "next/navigation";
import { SimulationRunner } from "@/components/SimulationRunner";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth-helpers";
import type { Attempt, Simulation, StageScore } from "@/types";

type PageProps = {
  params: { id: string };
  searchParams: { attempt?: string };
};

/**
 * Student simulation session page.
 */
export default async function StudentSimulationPage({
  params,
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const profile = await requireRole("student");
  const supabase = createClient();

  const { data: simulation } = await supabase
    .from("simulations")
    .select("*")
    .eq("id", params.id)
    .eq("is_published", true)
    .single();

  if (!simulation) {
    redirect("/student/dashboard");
  }

  let attempt: Attempt | null = null;

  if (searchParams.attempt) {
    const { data } = await supabase
      .from("attempts")
      .select("*")
      .eq("id", searchParams.attempt)
      .eq("student_id", profile.id)
      .single();
    attempt = data as Attempt | null;
  }

  if (!attempt) {
    const { data: existing } = await supabase
      .from("attempts")
      .select("*")
      .eq("simulation_id", params.id)
      .eq("student_id", profile.id)
      .eq("status", "in_progress")
      .maybeSingle();

    if (existing) {
      attempt = existing as Attempt;
    } else {
      const { data: created } = await supabase
        .from("attempts")
        .insert({
          student_id: profile.id,
          simulation_id: params.id,
          current_stage: "lead_gen",
        })
        .select()
        .single();
      attempt = created as Attempt;
    }
  }

  if (!attempt) {
    redirect("/student/dashboard");
  }

  if (attempt.status === "completed" || attempt.current_stage === "results") {
    redirect(`/student/simulation/${params.id}/complete?attempt=${attempt.id}`);
  }

  const { data: stageScores } = await supabase
    .from("stage_scores")
    .select("*")
    .eq("attempt_id", attempt.id);

  return (
    <SimulationRunner
      simulation={simulation as Simulation}
      attempt={attempt}
      stageScores={(stageScores ?? []) as StageScore[]}
    />
  );
}
