/**
 * CloseStage.tsx
 * Final Simli video-call to close the deal, then score the conversation.
 */

"use client";

import { SimliCallStage } from "@/components/call/SimliCallStage";
import type { Simulation } from "@/types";

type CloseStageProps = {
  simulation: Simulation;
  attemptId: string;
  runningTotalScore: number;
  onComplete: () => void;
};

/**
 * Close — video call with persona to finalize; completes the simulation after scoring.
 */
export function CloseStage({
  simulation,
  attemptId,
  runningTotalScore,
  onComplete,
}: CloseStageProps): React.ReactElement {
  return (
    <SimliCallStage
      simulation={simulation}
      attemptId={attemptId}
      stage="close"
      stageHint="CLOSE STAGE: The student is closing the deal on a video call. Respond in character — negotiate final terms, timing, or commitment realistically."
      openingGreeting={`Alright — let's wrap this up. What are you proposing?`}
      scoreStage="close"
      runningTotalScore={runningTotalScore}
      advanceLabel="Complete simulation"
      onAdvance={onComplete}
    />
  );
}
