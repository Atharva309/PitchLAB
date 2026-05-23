/**
 * SimulationRunner.tsx
 * Client stage router with full-width PipelineProgress (Stitch layout).
 */

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PipelineProgress } from "@/components/PipelineProgress";
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
 * Renders pipeline header and active stage content below.
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
    <div className="w-full max-w-5xl mx-auto">
      <PipelineProgress items={progress} />

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{simulation.title}</h1>
        <p className="text-sm text-text-secondary mt-1">
          Persona: {simulation.persona_name} · {simulation.persona_role}
        </p>
      </header>

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
            stageScores={stageScores}
            runningTotalScore={runningTotal}
            onComplete={handleSimulationComplete}
          />
        )}
        {stage === "results" && (
          <p className="text-text-secondary">Redirecting to results...</p>
        )}
      </ErrorBoundary>
    </div>
  );
}
