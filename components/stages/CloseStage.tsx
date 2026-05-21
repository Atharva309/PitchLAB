/**
 * CloseStage.tsx
 * Review prior stage scores and complete the simulation — no voice call.
 */

"use client";

import { useState } from "react";
import { StageScoresSummary } from "@/components/StageScoresSummary";
import { StageShell } from "@/components/StageShell";
import { completeStage, fetchStageScore } from "@/lib/attempt-actions";
import { SCORED_STAGES } from "@/lib/constants";
import type { Simulation, StageScore } from "@/types";

type CloseStageProps = {
  simulation: Simulation;
  attemptId: string;
  stageScores: StageScore[];
  runningTotalScore: number;
  onComplete: () => void;
};

/**
 * Close stage — shows cumulative scores; final close score from overall performance.
 */
export function CloseStage({
  simulation,
  attemptId,
  stageScores,
  runningTotalScore,
  onComplete,
}: CloseStageProps): React.ReactElement {
  const [score, setScore] = useState<number | undefined>();
  const [feedback, setFeedback] = useState<string | undefined>();
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

  const handleComplete = async (): Promise<void> => {
    setIsLoading(true);
    setError("");
    try {
      const result = await fetchStageScore({
        stage: "close",
        transcript: `Overall performance summary:\n${summaryText}\nPrior total: ${runningTotalScore}/500`,
        simulationContext: context,
        runningTotalScore,
      });
      setScore(result.score);
      setFeedback(result.feedback);
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
    <StageShell
      score={score}
      feedback={feedback}
      isLoading={isLoading}
      error={error}
      canAdvance={score !== undefined}
      advanceLabel="Complete simulation"
      onAdvance={onComplete}
    >
      <p className="text-sm text-gray-600 mb-4">
        Review your scores from each stage. When you are ready, complete the simulation to
        see your final results and leaderboard.
      </p>
      <StageScoresSummary stageScores={stageScores} runningTotal={runningTotalScore} />
      {score === undefined && (
        <button
          type="button"
          onClick={() => void handleComplete()}
          disabled={isLoading}
          className="mt-6 px-5 py-2.5 bg-gray-900 text-white text-sm rounded disabled:opacity-50"
        >
          {isLoading ? "Scoring..." : "Complete simulation"}
        </button>
      )}
    </StageShell>
  );
}
