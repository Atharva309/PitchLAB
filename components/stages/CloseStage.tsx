/**
 * CloseStage.tsx
 * Final closing attempt via voice only (no Simli) — same UX as prospecting.
 */

"use client";

import { useState } from "react";
import { StageShell } from "@/components/StageShell";
import { completeStage, fetchStageScore } from "@/lib/attempt-actions";
import { useProspectingVoice } from "@/hooks/useProspectingVoice";
import type { Simulation, SimulationStage } from "@/types";

type CloseStageProps = {
  simulation: Simulation;
  attemptId: string;
  runningTotalScore: number;
  onComplete: () => void;
};

/**
 * Close stage — voice-only final ask; completes simulation on score.
 */
export function CloseStage({
  simulation,
  attemptId,
  runningTotalScore,
  onComplete,
}: CloseStageProps): React.ReactElement {
  const [score, setScore] = useState<number | undefined>();
  const [feedback, setFeedback] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [callEnded, setCallEnded] = useState(false);

  const voice = useProspectingVoice({
    systemPrompt: simulation.persona_system_prompt,
    personaName: simulation.persona_name,
    stageHint: `CLOSE STAGE: Student's score so far is ${runningTotalScore}/500 before this stage. Accept, defer, or reject based on performance. Let them finish speaking.`,
    openingGreeting: `Alright — make your case. Why should I say yes today?`,
  });

  const context = {
    personaName: simulation.persona_name,
    personaRole: simulation.persona_role,
    personaSystemPrompt: simulation.persona_system_prompt,
    productContext: simulation.product_context,
  };

  const handleEndAndScore = async (): Promise<void> => {
    voice.endCall();
    setCallEnded(true);
    setIsLoading(true);
    setError("");
    try {
      const transcript = voice.getFullTranscript();
      const result = await fetchStageScore({
        stage: "close",
        transcript,
        simulationContext: context,
        runningTotalScore,
      });
      setScore(result.score);
      setFeedback(result.feedback);
      await completeStage(attemptId, "close", result.score, result.feedback, transcript);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scoring failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!callEnded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-900 text-white rounded-lg">
        <div className="w-16 h-16 rounded-full border-2 border-gray-600 flex items-center justify-center mb-6 text-2xl">
          📞
        </div>
        <p className="text-lg font-medium">
          {voice.isActive ? `Closing with ${simulation.persona_name}` : voice.statusText}
        </p>
        <p className="text-sm text-gray-400 mt-2 max-w-md text-center">
          {voice.personaTranscripts || "Start the call when you are ready."}
        </p>
        <p className="text-xs text-gray-500 mt-4 max-w-sm text-center">
          Wait until {simulation.persona_name} finishes speaking before you talk.
        </p>
        <div className="flex gap-3 mt-8">
          {!voice.isActive ? (
            <button
              type="button"
              onClick={() => void voice.startCall()}
              className="px-6 py-3 bg-green-600 rounded text-sm font-medium"
            >
              Start Call
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleEndAndScore()}
              className="px-6 py-3 bg-red-600 rounded text-sm font-medium"
            >
              End close & score
            </button>
          )}
        </div>
        {voice.userTranscripts && (
          <p className="text-xs text-gray-400 mt-6">You: {voice.userTranscripts}</p>
        )}
      </div>
    );
  }

  return (
    <StageShell
      score={score}
      feedback={feedback}
      isLoading={isLoading}
      error={error}
      canAdvance={score !== undefined}
      advanceLabel="Complete Simulation"
      onAdvance={onComplete}
    >
      <p className="text-sm text-gray-600">Close complete. Review your score below.</p>
    </StageShell>
  );
}
