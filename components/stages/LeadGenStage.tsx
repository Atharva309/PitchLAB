/**
 * LeadGenStage.tsx
 * Text-based lead qualification — no avatar or voice.
 */

"use client";

import { useState } from "react";
import { StageShell } from "@/components/StageShell";
import { completeStage, fetchStageScore } from "@/lib/attempt-actions";
import type { Simulation, SimulationStage } from "@/types";

type LeadGenStageProps = {
  simulation: Simulation;
  attemptId: string;
  onComplete: (nextStage: SimulationStage) => void;
};

/**
 * Lead gen stage — three qualification text answers scored by GPT.
 */
export function LeadGenStage({
  simulation,
  attemptId,
  onComplete,
}: LeadGenStageProps): React.ReactElement {
  const [fit, setFit] = useState("");
  const [painPoints, setPainPoints] = useState("");
  const [openingApproach, setOpeningApproach] = useState("");
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

  const handleSubmit = async (): Promise<void> => {
    setIsLoading(true);
    setError("");
    try {
      const result = await fetchStageScore({
        stage: "lead_gen",
        studentAnswers: { fit, painPoints, openingApproach },
        simulationContext: context,
      });
      setScore(result.score);
      setFeedback(result.feedback);
      await completeStage(
        attemptId,
        "lead_gen",
        result.score,
        result.feedback,
        JSON.stringify({ fit, painPoints, openingApproach })
      );
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
      onAdvance={() => onComplete("prospecting")}
    >
      <div className="border border-gray-200 rounded-lg p-5 bg-white">
        <h2 className="font-semibold text-gray-900">Prospect profile</h2>
        <p className="text-sm text-gray-600 mt-2">
          <strong>{simulation.persona_name}</strong> — {simulation.persona_role}
        </p>
        <p className="text-sm text-gray-500 mt-2">{simulation.product_context}</p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Is this prospect a good fit? Why?
          <textarea
            className="mt-1 w-full border border-gray-200 rounded p-3 text-sm"
            rows={3}
            value={fit}
            onChange={(e) => setFit(e.target.value)}
            disabled={score !== undefined}
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          What pain points do they likely have?
          <textarea
            className="mt-1 w-full border border-gray-200 rounded p-3 text-sm"
            rows={3}
            value={painPoints}
            onChange={(e) => setPainPoints(e.target.value)}
            disabled={score !== undefined}
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          What is your opening approach?
          <textarea
            className="mt-1 w-full border border-gray-200 rounded p-3 text-sm"
            rows={3}
            value={openingApproach}
            onChange={(e) => setOpeningApproach(e.target.value)}
            disabled={score !== undefined}
          />
        </label>
        {score === undefined && (
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isLoading || !fit || !painPoints || !openingApproach}
            className="px-5 py-2.5 bg-gray-900 text-white text-sm rounded disabled:opacity-50"
          >
            Submit answers
          </button>
        )}
      </div>
    </StageShell>
  );
}
