/**
 * ObjectionsStage.tsx
 * Simli video-call UI for handling objections after the written pitch.
 */

"use client";

import { useState } from "react";
import { StageShell } from "@/components/StageShell";
import { VideoCallStage } from "@/components/VideoCallStage";
import { OBJECTIONS_COUNT } from "@/lib/constants";
import { completeStage, fetchStageScore } from "@/lib/attempt-actions";
import { useSimulationVoiceSession } from "@/hooks/useSimulationVoiceSession";
import type { Simulation, SimulationStage } from "@/types";

type ObjectionsStageProps = {
  simulation: Simulation;
  attemptId: string;
  pitchText: string;
  runningTotalScore: number;
  onComplete: (nextStage: SimulationStage) => void;
};

/**
 * Objections stage — video call; persona raises objections from the pitch.
 */
export function ObjectionsStage({
  simulation,
  attemptId,
  pitchText,
  runningTotalScore,
  onComplete,
}: ObjectionsStageProps): React.ReactElement {
  const [score, setScore] = useState<number | undefined>();
  const [feedback, setFeedback] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const voice = useSimulationVoiceSession({
    systemPrompt: simulation.persona_system_prompt,
    stageHint: `OBJECTIONS STAGE: The student pitched: """${pitchText}""" Raise ${OBJECTIONS_COUNT} specific objections (price, timing, fit). Push back realistically.`,
    openingGreeting: `I read your pitch. I've got a few concerns — let's hear how you handle them.`,
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
        stage: "objections",
        transcript: `${transcript}\n\nPitch:\n${pitchText}`,
        simulationContext: context,
        runningTotalScore,
      });
      setScore(result.score);
      setFeedback(result.feedback);
      await completeStage(attemptId, "objections", result.score, result.feedback, transcript);
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
      onAdvance={() => onComplete("close")}
    >
      <p className="text-sm text-gray-600 mb-4">
        Handle {OBJECTIONS_COUNT} objections from {simulation.persona_name} in the video call.
      </p>
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
        finishLabel="Finish objections & score"
      />
    </StageShell>
  );
}
