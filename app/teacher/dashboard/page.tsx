/**
 * dashboard/page.tsx — teacher
 * Lists teacher simulations with Stitch table layout.
 */

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth-helpers";
import type { Simulation } from "@/types";

/**
 * Teacher dashboard — manage simulations.
 */
export default async function TeacherDashboardPage(): Promise<React.ReactElement> {
  const profile = await requireRole("teacher");
  const supabase = createClient();

  const { data: simulations } = await supabase
    .from("simulations")
    .select("*")
    .eq("teacher_id", profile.id)
    .order("created_at", { ascending: false });

  const list = (simulations ?? []) as Simulation[];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My simulations</h1>
          <p className="text-sm text-text-secondary mt-1">Create and manage training scenarios</p>
        </div>
        <Link href="/teacher/simulation/new" className="btn-primary shrink-0">
          Create New Simulation
        </Link>
      </div>

      {/* TODO: analytics */}
      <div
        className="mt-6 card-surface p-8 text-center text-text-secondary text-sm hidden lg:block opacity-0 h-0 overflow-hidden"
        aria-hidden
      >
        Analytics chart placeholder
      </div>

      {list.length === 0 ? (
        <p className="text-text-secondary mt-12 text-center card-surface py-12">
          No simulations yet. Create your first scenario.
        </p>
      ) : (
        <div className="mt-8 card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-text-secondary border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Persona</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((sim) => (
                <tr key={sim.id} className="border-t border-border hover:bg-surface/50">
                  <td className="px-4 py-3 font-medium text-text-primary">{sim.title}</td>
                  <td className="px-4 py-3 text-text-secondary">{sim.persona_name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        sim.is_published
                          ? "bg-success/10 text-success"
                          : "bg-surface text-text-secondary border border-border"
                      }`}
                    >
                      {sim.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-4">
                    <Link
                      href={`/teacher/simulation/${sim.id}/edit`}
                      className="text-accent font-medium hover:underline"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/teacher/simulation/${sim.id}/results`}
                      className="text-accent font-medium hover:underline"
                    >
                      Results
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
