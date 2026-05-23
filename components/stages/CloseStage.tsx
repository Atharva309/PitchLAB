/**
 * CloseStage.tsx
 * Review prior stage scores and complete the simulation — no video call UI.
 */

"use client";

import { useMemo, useState } from "react";
import { StageScoresSummary } from "@/components/StageScoresSummary";
import { completeStage, fetchStageScore } from "@/lib/attempt-actions";
import { SCORED_STAGES } from "@/lib/constants";
import type { Simulation, SimulationStage, StageScore } from "@/types";

type CloseStageProps = {
  simulation: Simulation;
  attemptId: string;
  stageScores: StageScore[];
  runningTotalScore: number;
  onComplete: () => void;
};

/**
 * Close stage — scores table only; no call controls or extra chrome.
 */
export function CloseStage({
  simulation,
  attemptId,
  stageScores,
  runningTotalScore,
  onComplete,
}: CloseStageProps): React.ReactElement {
  const [closeScore, setCloseScore] = useState<number | undefined>();
  const [closeFeedback, setCloseFeedback] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const context = {
    personaName: simulation.persona_name,
    personaRole: simulation.persona_role,
    personaSystemPrompt: simulation.persona_system_prompt,
    productContext: simulation.product_context,
  };

  const summaryText = SCORED_STAGES.filter((s) => s !== "close")
    .map((stage) => {
      const row = stageScores.find((sc) => sc.stage === stage);
      return row
        ? `${stage}: ${row.score}/100 — ${row.feedback ?? ""}`
        : `${stage}: not completed`;
    })
    .join("\n");

  const displayScores = useMemo((): StageScore[] => {
    if (closeScore === undefined) {
      return stageScores;
    }
    const closeRow: StageScore = {
      id: "close-summary",
      attempt_id: attemptId,
      stage: "close" as SimulationStage,
      score: closeScore,
      feedback: closeFeedback ?? null,
      transcript: null,
      completed_at: new Date().toISOString(),
    };
    return [...stageScores.filter((s) => s.stage !== "close"), closeRow];
  }, [stageScores, closeScore, closeFeedback, attemptId]);

  const displayTotal =
    closeScore !== undefined ? runningTotalScore + closeScore : runningTotalScore;

  const handleComplete = async (): Promise<void> => {
    setIsLoading(true);
    setError("");
    try {
      const result = await fetchStageScore({
        stage: "close",
        transcript: `Overall performance summary:\n${summaryText}\nPrior total: ${runningTotalScore}/600`,
        simulationContext: context,
        runningTotalScore,
      });
      setCloseScore(result.score);
      setCloseFeedback(result.feedback);
      await completeStage(
        attemptId,
        "close",
        result.score,
        result.feedback,
        `Summary close based on prior stages.\n${summaryText}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scoring failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <StageScoresSummary stageScores={displayScores} runningTotal={displayTotal} />
      {error && (
        <p className="text-sm text-red-600 border border-red-200 rounded p-3 mt-4">{error}</p>
      )}
      {closeScore === undefined ? (
        <button
          type="button"
          onClick={() => void handleComplete()}
          disabled={isLoading}
          className="mt-6 btn-primary disabled:opacity-50"
        >
          {isLoading ? "Scoring…" : "Complete simulation"}
        </button>
      ) : (
        <button
          type="button"
          onClick={onComplete}
          className="mt-6 btn-accent"
        >
          View final results
        </button>
      )}
    </div>
  );
}
