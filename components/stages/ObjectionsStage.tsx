/**
 * ObjectionsStage.tsx
 * Simli avatar — student handles objections via voice after written pitch.
 */

"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { CallControls } from "@/components/CallControls";
import { Transcript } from "@/components/Transcript";
import { StageShell } from "@/components/StageShell";
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
 * Objections stage — persona raises objections from the student's pitch.
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
  const [objectionHint, setObjectionHint] = useState("");

  const voice = useSimulationVoiceSession({
    systemPrompt: `${simulation.persona_system_prompt}
OBJECTIONS STAGE: The student pitched: """${pitchText}"""
Raise ${OBJECTIONS_COUNT} specific objections (price, timing, fit). Push back realistically. Keep replies short.`,
    openingGreeting: `I read your pitch. I've got a few concerns — let's hear how you handle them.`,
  });

  useEffect(() => {
    setObjectionHint(
      `Handle ${OBJECTIONS_COUNT} objections from ${simulation.persona_name} about your pitch.`
    );
  }, [simulation.persona_name]);

  const context = {
    personaName: simulation.persona_name,
    personaRole: simulation.persona_role,
    personaSystemPrompt: simulation.persona_system_prompt,
    productContext: simulation.product_context,
  };

  const handleFinish = async (): Promise<void> => {
    voice.endCall();
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
      <p className="text-sm text-gray-600">{objectionHint}</p>
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
            onClick={() => void handleFinish()}
            className="px-5 py-2 border border-gray-300 rounded text-sm"
          >
            Finish objections
          </button>
        )}
      </div>
    </StageShell>
  );
}
