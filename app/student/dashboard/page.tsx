/**
 * dashboard/page.tsx — student
 * Lists published simulations and completed attempt history (Stitch layout).
 */

import { SimulationCard } from "@/components/SimulationCard";
import {
  StudentAttemptHistory,
  type StudentAttemptRow,
} from "@/components/StudentAttemptHistory";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth-helpers";
import type { Attempt, Simulation } from "@/types";

/**
 * Student home — browse simulations and review past scores.
 */
export default async function StudentDashboardPage(): Promise<React.ReactElement> {
  const profile = await requireRole("student");
  const supabase = createClient();

  const { data: simulations } = await supabase
    .from("simulations")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const { data: attempts } = await supabase
    .from("attempts")
    .select("*")
    .eq("student_id", profile.id)
    .eq("status", "in_progress");

  const { data: completedAttempts } = await supabase
    .from("attempts")
    .select("id, total_score, completed_at, simulations ( id, title, persona_name )")
    .eq("student_id", profile.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(20);

  const attemptBySim = new Map(
    (attempts ?? []).map((a: Attempt) => [a.simulation_id, a])
  );

  const list = (simulations ?? []) as Simulation[];

  const history: StudentAttemptRow[] = (completedAttempts ?? []).map((row) => {
    const sim = row.simulations;
    const simulation = Array.isArray(sim) ? sim[0] ?? null : sim;
    return {
      id: row.id as string,
      total_score: row.total_score as number,
      completed_at: row.completed_at as string | null,
      simulations: simulation as StudentAttemptRow["simulations"],
    };
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Simulations</h1>
          <p className="text-sm text-text-secondary mt-1">
            Choose a scenario to practice your pitch.
          </p>
        </div>
        {/* TODO: search */}
        <input
          type="search"
          placeholder="Search simulations…"
          disabled
          aria-label="Search simulations"
          className="input-field max-w-xs opacity-60 cursor-not-allowed"
          title="Search coming soon"
        />
      </div>

      {list.length === 0 ? (
        <p className="text-text-secondary mt-12 text-center card-surface py-12">
          No published simulations yet. Check back soon.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {list.map((sim) => {
            const existing = attemptBySim.get(sim.id);
            return (
              <SimulationCard
                key={sim.id}
                simulation={sim}
                actionLabel={existing ? "Continue" : "Start"}
                href={`/student/simulation/${sim.id}${existing ? `?attempt=${existing.id}` : ""}`}
              />
            );
          })}
        </div>
      )}

      <StudentAttemptHistory attempts={history} />
    </div>
  );
}
