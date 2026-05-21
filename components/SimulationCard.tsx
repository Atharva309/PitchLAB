/**
 * SimulationCard.tsx
 * Card on the student dashboard for a published simulation.
 */

"use client";

import Link from "next/link";
import type { Simulation } from "@/types";

type SimulationCardProps = {
  simulation: Simulation;
  actionLabel: string;
  href: string;
};

/**
 * Displays simulation summary with start/continue CTA.
 */
export function SimulationCard({
  simulation,
  actionLabel,
  href,
}: SimulationCardProps): React.ReactElement {
  return (
    <div className="border border-gray-200 rounded-lg p-5 bg-white flex flex-col gap-3">
      <h3 className="font-semibold text-gray-900">{simulation.title}</h3>
      <p className="text-sm text-gray-600">
        Persona: {simulation.persona_name} — {simulation.persona_role}
      </p>
      <p className="text-sm text-gray-500 line-clamp-2">{simulation.product_context}</p>
      <Link
        href={href}
        className="mt-auto inline-flex justify-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
