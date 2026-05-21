/**
 * SimulationRunner.tsx
 * Client stage router for an in-progress student attempt.
 */

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CompletedStagesPanel } from "@/components/CompletedStagesPanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StageProgress } from "@/components/StageProgress";
import { CloseStage } from "@/components/stages/CloseStage";
import { DiscoveryStage } from "@/components/stages/DiscoveryStage";
import { LeadGenStage } from "@/components/stages/LeadGenStage";
import { ObjectionsStage } from "@/components/stages/ObjectionsStage";
import { PresentationStage } from "@/components/stages/PresentationStage";
import { ProspectingStage } from "@/components/stages/ProspectingStage";
import { buildStageProgress } from "@/lib/stages";
import type { Attempt, Simulation, SimulationStage, StageScore } from "@/types";

type SimulationRunnerProps = {
  simulation: Simulation;
  attempt: Attempt;
  stageScores: StageScore[];
};

/**
 * Renders the active stage component and sidebar progress.
 */
export function SimulationRunner({
  simulation,
  attempt: initialAttempt,
  stageScores: initialScores,
}: SimulationRunnerProps): React.ReactElement {
  const router = useRouter();
  const [attempt, setAttempt] = useState(initialAttempt);
  const [stageScores, setStageScores] = useState(initialScores);

  useEffect(() => {
    setAttempt(initialAttempt);
    setStageScores(initialScores);
  }, [initialAttempt, initialScores]);

  const progress = useMemo(
    () => buildStageProgress(attempt.current_stage, stageScores),
    [attempt.current_stage, stageScores]
  );

  const runningTotal = stageScores.reduce((s, row) => s + row.score, 0);

  const discoveryTranscript =
    stageScores.find((s) => s.stage === "discovery")?.transcript ?? "";
  const pitchText = stageScores.find((s) => s.stage === "presentation")?.transcript ?? "";

  const handleStageComplete = (next: SimulationStage): void => {
    setAttempt((a) => ({ ...a, current_stage: next }));
    router.refresh();
  };

  const handleSimulationComplete = (): void => {
    router.push(`/student/simulation/${simulation.id}/complete?attempt=${attempt.id}`);
  };

  const stage = attempt.current_stage;

  return (
    <div className="flex gap-8">
      <StageProgress items={progress} />
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{simulation.title}</h1>
        <p className="text-sm text-gray-500 mb-4">{simulation.persona_name}</p>

        <CompletedStagesPanel stageScores={stageScores} currentStage={stage} />

        <ErrorBoundary stageName={stage}>
          {stage === "lead_gen" && (
            <LeadGenStage
              simulation={simulation}
              attemptId={attempt.id}
              onComplete={handleStageComplete}
            />
          )}
          {stage === "prospecting" && (
            <ProspectingStage
              simulation={simulation}
              attemptId={attempt.id}
              onComplete={handleStageComplete}
            />
          )}
          {stage === "discovery" && (
            <DiscoveryStage
              simulation={simulation}
              attemptId={attempt.id}
              runningTotalScore={runningTotal}
              onComplete={handleStageComplete}
            />
          )}
          {stage === "presentation" && (
            <PresentationStage
              simulation={simulation}
              attemptId={attempt.id}
              discoveryNotes={discoveryTranscript}
              runningTotalScore={runningTotal}
              onComplete={handleStageComplete}
            />
          )}
          {stage === "objections" && (
            <ObjectionsStage
              simulation={simulation}
              attemptId={attempt.id}
              pitchText={pitchText}
              runningTotalScore={runningTotal}
              onComplete={handleStageComplete}
            />
          )}
          {stage === "close" && (
            <CloseStage
              simulation={simulation}
              attemptId={attempt.id}
              runningTotalScore={runningTotal}
              onComplete={handleSimulationComplete}
            />
          )}
          {stage === "results" && (
            <p className="text-gray-600">Redirecting to results...</p>
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}
