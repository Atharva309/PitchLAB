/**
 * CloseStage.tsx
 * Final Simli closing attempt — outcome influenced by running score context.
 */

"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { CallControls } from "@/components/CallControls";
import { Transcript } from "@/components/Transcript";
import { StageShell } from "@/components/StageShell";
import { completeStage, fetchStageScore } from "@/lib/attempt-actions";
import { useSimulationVoiceSession } from "@/hooks/useSimulationVoiceSession";
import type { Simulation, SimulationStage } from "@/types";

type CloseStageProps = {
  simulation: Simulation;
  attemptId: string;
  runningTotalScore: number;
  onComplete: () => void;
};

/**
 * Close stage — final voice attempt; completes simulation on success.
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

  const voice = useSimulationVoiceSession({
    systemPrompt: `${simulation.persona_system_prompt}
CLOSE STAGE: Student's performance so far totals ${runningTotalScore}/500 before this stage.
If they did well, you may accept or ask for time. If poorly, reject or defer. Stay in character.`,
    openingGreeting: `Alright — make your case. Why should I say yes today?`,
  });

  const context = {
    personaName: simulation.persona_name,
    personaRole: simulation.persona_role,
    personaSystemPrompt: simulation.persona_system_prompt,
    productContext: simulation.product_context,
  };

  const handleComplete = async (): Promise<void> => {
    voice.endCall();
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
      <div className="flex flex-col items-center gap-4">
        <Avatar ref={voice.avatarRef} />
        <CallControls
          isActive={voice.isActive}
          onStart={() => void voice.startCall()}
          onEnd={() => voice.endCall()}
          statusText={voice.statusText}
        />
        <Transcript userText={voice.userTranscripts} danaText={voice.personaTranscripts} />
        {score === undefined && (
          <button
            type="button"
            onClick={() => void handleComplete()}
            className="px-5 py-2.5 bg-gray-900 text-white text-sm rounded"
          >
            End close & score
          </button>
        )}
      </div>
    </StageShell>
  );
}
