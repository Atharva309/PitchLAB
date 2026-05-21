/**
 * dashboard/page.tsx — student
 * Lists published simulations with start/continue actions.
 */

import { SimulationCard } from "@/components/SimulationCard";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth-helpers";
import type { Attempt, Simulation } from "@/types";

/**
 * Student home — browse published simulations.
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

  const attemptBySim = new Map(
    (attempts ?? []).map((a: Attempt) => [a.simulation_id, a])
  );

  const list = (simulations ?? []) as Simulation[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Simulations</h1>
      <p className="text-sm text-gray-500 mt-1">Choose a scenario to practice your pitch.</p>

      {list.length === 0 ? (
        <p className="text-gray-500 mt-12 text-center border border-gray-200 rounded-lg py-12">
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
    </div>
  );
}
