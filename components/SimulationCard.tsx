/**
 * SimulationCard.tsx
 * Student dashboard card with gold left accent (Stitch design).
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
    <article className="card-surface border-l-4 border-l-gold p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-text-primary">{simulation.title}</h3>
      <p className="text-sm text-text-secondary">
        {simulation.persona_name} · {simulation.persona_role}
      </p>
      <p className="text-sm text-text-secondary line-clamp-2">{simulation.product_context}</p>
      <Link href={href} className="mt-auto inline-flex justify-center btn-primary">
        {actionLabel}
      </Link>
    </article>
  );
}
