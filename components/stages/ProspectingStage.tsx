/**
 * ProspectingStage.tsx
 * Phone-call UI (voice only, no Simli) via PhoneCallStage orchestrator.
 */

"use client";

import { PhoneCallStage } from "@/components/call/PhoneCallStage";
import type { Simulation, SimulationStage } from "@/types";

type ProspectingStageProps = {
  simulation: Simulation;
  attemptId: string;
  onComplete: (nextStage: SimulationStage) => void;
};

/**
 * Prospecting — cold call with waveform UI; no video avatar.
 */
export function ProspectingStage({
  simulation,
  attemptId,
  onComplete,
}: ProspectingStageProps): React.ReactElement {
  return (
    <PhoneCallStage
      simulation={simulation}
      attemptId={attemptId}
      stageHint="PROSPECTING STAGE: You are on a short cold call. Be busy but fair."
      onAdvance={() => onComplete("discovery")}
    />
  );
}
