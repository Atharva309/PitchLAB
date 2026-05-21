/**
 * DiscoveryStage.tsx
 * Simli avatar + live voice discovery conversation.
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

type DiscoveryStageProps = {
  simulation: Simulation;
  attemptId: string;
  runningTotalScore: number;
  onComplete: (nextStage: SimulationStage) => void;
};

/**
 * Discovery stage — Simli avatar with scored conversation transcript.
 */
export function DiscoveryStage({
  simulation,
  attemptId,
  runningTotalScore,
  onComplete,
}: DiscoveryStageProps): React.ReactElement {
  const [score, setScore] = useState<number | undefined>();
  const [feedback, setFeedback] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const voice = useSimulationVoiceSession({
    systemPrompt: `${simulation.persona_system_prompt}\nThe student is in the DISCOVERY stage. Answer questions in character. Do not agree to buy yet.`,
  });

  const context = {
    personaName: simulation.persona_name,
    personaRole: simulation.persona_role,
    personaSystemPrompt: simulation.persona_system_prompt,
    productContext: simulation.product_context,
  };

  const handleEndDiscovery = async (): Promise<void> => {
    voice.endCall();
    setIsLoading(true);
    setError("");
    try {
      const transcript = voice.getFullTranscript();
      const result = await fetchStageScore({
        stage: "discovery",
        transcript,
        simulationContext: context,
        runningTotalScore,
      });
      setScore(result.score);
      setFeedback(result.feedback);
      await completeStage(attemptId, "discovery", result.score, result.feedback, transcript);
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
      onAdvance={() => onComplete("presentation")}
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
            onClick={() => void handleEndDiscovery()}
            className="px-5 py-2 border border-gray-300 rounded text-sm"
          >
            End Discovery
          </button>
        )}
      </div>
    </StageShell>
  );
}
