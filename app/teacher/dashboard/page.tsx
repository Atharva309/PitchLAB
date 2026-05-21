/**
 * dashboard/page.tsx — teacher
 * Lists teacher simulations with actions.
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My simulations</h1>
        <Link
          href="/teacher/simulation/new"
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded"
        >
          Create New Simulation
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="text-gray-500 mt-12 text-center border border-gray-200 rounded-lg py-12">
          No simulations yet. Create your first scenario.
        </p>
      ) : (
        <div className="mt-8 border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((sim) => (
                <tr key={sim.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium">{sim.title}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        sim.is_published
                          ? "bg-green-50 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {sim.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-3">
                    <Link href={`/teacher/simulation/${sim.id}/edit`} className="underline">
                      Edit
                    </Link>
                    <Link href={`/teacher/simulation/${sim.id}/results`} className="underline">
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
