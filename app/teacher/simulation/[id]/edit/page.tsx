/**
 * simulation/[id]/edit/page.tsx — teacher
 */

import { redirect } from "next/navigation";
import { SimulationForm } from "@/components/SimulationForm";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth-helpers";
import type { Simulation } from "@/types";

type PageProps = { params: { id: string } };

/**
 * Edit existing simulation.
 */
export default async function EditSimulationPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const profile = await requireRole("teacher");
  const supabase = createClient();

  const { data } = await supabase
    .from("simulations")
    .select("*")
    .eq("id", params.id)
    .eq("teacher_id", profile.id)
    .single();

  if (!data) redirect("/teacher/dashboard");

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Edit simulation</h1>
      <p className="text-sm text-text-secondary mb-6">Update scenario details and republish when ready.</p>
      <SimulationForm teacherId={profile.id} initial={data as Simulation} />
    </div>
  );
}
