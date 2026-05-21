/**
 * PresentationStage.tsx
 * Written pitch scored against discovery notes — no avatar.
 */

"use client";

import { useState } from "react";
import { StageShell } from "@/components/StageShell";
import { PRESENTATION_MIN_WORDS } from "@/lib/constants";
import { completeStage, fetchStageScore } from "@/lib/attempt-actions";
import type { Simulation, SimulationStage } from "@/types";

type PresentationStageProps = {
  simulation: Simulation;
  attemptId: string;
  discoveryNotes: string;
  runningTotalScore: number;
  onComplete: (nextStage: SimulationStage) => void;
};

/**
 * Counts words in pitch text for minimum length validation.
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Presentation stage — textarea pitch with discovery reference panel.
 */
export function PresentationStage({
  simulation,
  attemptId,
  discoveryNotes,
  runningTotalScore,
  onComplete,
}: PresentationStageProps): React.ReactElement {
  const [pitch, setPitch] = useState("");
  const [score, setScore] = useState<number | undefined>();
  const [feedback, setFeedback] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const wordCount = countWords(pitch);
  const context = {
    personaName: simulation.persona_name,
    personaRole: simulation.persona_role,
    personaSystemPrompt: simulation.persona_system_prompt,
    productContext: simulation.product_context,
  };

  const handleSubmit = async (): Promise<void> => {
    setIsLoading(true);
    setError("");
    try {
      const result = await fetchStageScore({
        stage: "presentation",
        pitchText: pitch,
        transcript: discoveryNotes,
        simulationContext: context,
        runningTotalScore,
      });
      setScore(result.score);
      setFeedback(result.feedback);
      await completeStage(attemptId, "presentation", result.score, result.feedback, pitch);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
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
      onAdvance={() => onComplete("objections")}
    >
      <p className="text-sm text-gray-600">
        Write your pitch to {simulation.persona_name} based on what you learned in Discovery.
      </p>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <textarea
            className="w-full border border-gray-200 rounded-lg p-4 text-sm min-h-[280px]"
            placeholder="Your pitch..."
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            disabled={score !== undefined}
          />
          <p className="text-xs text-gray-500 mt-2">
            {wordCount} words (min {PRESENTATION_MIN_WORDS})
          </p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm text-gray-700">
          <p className="font-medium text-gray-900 mb-2">Discovery notes</p>
          <pre className="whitespace-pre-wrap font-sans text-xs">{discoveryNotes || "No discovery transcript yet."}</pre>
        </div>
      </div>
      {score === undefined && (
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isLoading || wordCount < PRESENTATION_MIN_WORDS}
          className="px-5 py-2.5 bg-gray-900 text-white text-sm rounded disabled:opacity-50"
        >
          Submit pitch
        </button>
      )}
    </StageShell>
  );
}
