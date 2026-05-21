/**
 * simulation/new/page.tsx — teacher
 */

import { SimulationForm } from "@/components/SimulationForm";
import { requireRole } from "@/lib/auth-helpers";

/**
 * Create new simulation.
 */
export default async function NewSimulationPage(): Promise<React.ReactElement> {
  const profile = await requireRole("teacher");
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create simulation</h1>
      <SimulationForm teacherId={profile.id} />
    </div>
  );
}
