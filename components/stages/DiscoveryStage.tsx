/**
 * DiscoveryStage.tsx
 * Simli video-call UI — avatar stays visible; mic joins/leaves separately.
 */

"use client";

import { useState } from "react";
import { StageShell } from "@/components/StageShell";
import { VideoCallStage } from "@/components/VideoCallStage";
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
 * Discovery stage — video call with persistent Simli avatar.
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
    systemPrompt: simulation.persona_system_prompt,
    stageHint:
      "DISCOVERY STAGE: Answer the student's questions in character. Do not agree to buy yet.",
    openingGreeting: `Yeah? I'm ${simulation.persona_name} — what do you want to know?`,
  });

  const context = {
    personaName: simulation.persona_name,
    personaRole: simulation.persona_role,
    personaSystemPrompt: simulation.persona_system_prompt,
    productContext: simulation.product_context,
  };

  const handleFinish = async (): Promise<void> => {
    voice.stopListening();
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
      <VideoCallStage
        avatarRef={voice.avatarRef}
        personaName={simulation.persona_name}
        isListening={voice.isActive}
        statusText={voice.statusText}
        userTranscripts={voice.userTranscripts}
        personaTranscripts={voice.personaTranscripts}
        onJoinCall={() => void voice.startCall()}
        onLeaveCall={() => voice.stopListening()}
        onFinishStage={() => void handleFinish()}
        isFinishDisabled={isLoading}
        finishLabel="End discovery & score"
      />
    </StageShell>
  );
}
