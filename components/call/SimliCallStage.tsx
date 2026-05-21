/**
 * SimliCallStage.tsx
 * Orchestrates lobby → Simli connect → active call → score for Discovery, Objections, Close.
 * Avatar mounts once after Join Call and is not remounted until the call ends.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { CallLayout } from "@/components/call/CallLayout";
import { CallLobby } from "@/components/call/CallLobby";
import { EndCallModal } from "@/components/call/EndCallModal";
import { ScoreBadge } from "@/components/ScoreBadge";
import { completeStage, fetchStageScore } from "@/lib/attempt-actions";
import { CALL_SCORE_DELAY_MS, SIMLI_CONNECT_TIMEOUT_MS } from "@/lib/constants";
import { getStageCallLabel } from "@/lib/stages";
import { useSimulationVoiceSession } from "@/hooks/useSimulationVoiceSession";
import { useVideoCall } from "@/hooks/useVideoCall";
import type { Simulation, SimulationStage } from "@/types";

type CallPhase = "lobby" | "connecting" | "active" | "scoring" | "scored";

type SimliCallStageProps = {
  simulation: Simulation;
  attemptId: string;
  stage: SimulationStage;
  stageHint: string;
  openingGreeting: string;
  scoreStage: "discovery" | "objections" | "close";
  runningTotalScore?: number;
  scoreTranscriptExtra?: string;
  advanceLabel: string;
  onAdvance: () => void;
};

/**
 * Shared video-call flow for all Simli-powered simulation stages.
 */
export function SimliCallStage({
  simulation,
  attemptId,
  stage,
  stageHint,
  openingGreeting,
  scoreStage,
  runningTotalScore = 0,
  scoreTranscriptExtra = "",
  advanceLabel,
  onAdvance,
}: SimliCallStageProps): React.ReactElement {
  const [phase, setPhase] = useState<CallPhase>("lobby");
  const [mountSimli, setMountSimli] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [score, setScore] = useState<number | undefined>();
  const [feedback, setFeedback] = useState<string | undefined>();
  const [scoreError, setScoreError] = useState("");

  const videoCall = useVideoCall({ withVideo: true });
  const connectStartedRef = useRef(false);

  const voice = useSimulationVoiceSession({
    systemPrompt: simulation.persona_system_prompt,
    stageHint,
    openingGreeting,
    isMutedRef: videoCall.isMutedRef,
  });

  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  const stageLabel = getStageCallLabel(stage);

  const handleJoinCall = useCallback((): void => {
    if (!videoCall.canJoin || !videoCall.stream) return;
    setConnectError("");
    connectStartedRef.current = false;
    setMountSimli(true);
    setPhase("connecting");
  }, [videoCall.canJoin, videoCall.stream]);

  useEffect(() => {
    if (phase !== "connecting" || !mountSimli || connectStartedRef.current) return;

    const run = async (): Promise<void> => {
      connectStartedRef.current = true;

      let waited = 0;
      while (!voiceRef.current.avatarRef.current && waited < 5000) {
        await new Promise<void>((r) => setTimeout(r, 200));
        waited += 200;
      }

      const ready = await voiceRef.current.avatarRef.current?.waitUntilReady(
        SIMLI_CONNECT_TIMEOUT_MS
      );
      if (!ready) {
        setConnectError(
          `Could not connect to ${simulation.persona_name} in time. Check Simli keys and try again.`
        );
        setMountSimli(false);
        setPhase("lobby");
        connectStartedRef.current = false;
        return;
      }

      const stream = videoCall.stream;
      if (!stream) {
        setPhase("lobby");
        setMountSimli(false);
        connectStartedRef.current = false;
        return;
      }

      try {
        voiceRef.current.avatarRef.current?.resumeAudioContext();
        await voiceRef.current.startCall(stream);
        videoCall.startTimer();
        setPhase("active");
      } catch {
        setConnectError("Could not start voice session. Reload and try again.");
        setMountSimli(false);
        setPhase("lobby");
        connectStartedRef.current = false;
      }
    };

    void run();
  }, [phase, mountSimli, videoCall.stream, simulation.persona_name]);

  const runScoring = useCallback(async (): Promise<void> => {
    setPhase("scoring");
    setScoreError("");
    const transcript = voiceRef.current.getFullTranscript();
    const fullTranscript = scoreTranscriptExtra
      ? `${transcript}\n\n${scoreTranscriptExtra}`
      : transcript;

    await new Promise<void>((r) => setTimeout(r, CALL_SCORE_DELAY_MS));

    try {
      const result = await fetchStageScore({
        stage: scoreStage,
        transcript: fullTranscript,
        simulationContext: {
          personaName: simulation.persona_name,
          personaRole: simulation.persona_role,
          personaSystemPrompt: simulation.persona_system_prompt,
          productContext: simulation.product_context,
        },
        runningTotalScore,
      });
      setScore(result.score);
      setFeedback(result.feedback);
      await completeStage(
        attemptId,
        scoreStage,
        result.score,
        result.feedback,
        fullTranscript
      );
      setPhase("scored");
    } catch (err) {
      setScoreError(err instanceof Error ? err.message : "Scoring failed");
      setPhase("active");
      setMountSimli(true);
    }
  }, [scoreTranscriptExtra, scoreStage, runningTotalScore, attemptId, simulation]);

  const handleConfirmEndCall = useCallback((): void => {
    setShowEndModal(false);
    voice.endCall();
    setMountSimli(false);
    videoCall.stopTimer();
    videoCall.stopAllTracks();
    void runScoring();
  }, [voice, videoCall, runScoring]);

  const showStudentPip =
    videoCall.permissionState === "ready" &&
    !videoCall.cameraUnavailable &&
    videoCall.stream !== null;

  if (phase === "scoring") {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-[#0a0a0a] text-white rounded-xl">
        <div className="w-10 h-10 border-2 border-gray-600 border-t-green-500 rounded-full animate-spin" />
        <p className="mt-4 text-sm text-gray-300">Scoring your conversation…</p>
      </div>
    );
  }

  if (phase === "scored" && score !== undefined && feedback) {
    return (
      <div className="space-y-6">
        <ScoreBadge score={score} />
        <p className="text-sm text-gray-700 leading-relaxed">{feedback}</p>
        {scoreError && <p className="text-sm text-red-600">{scoreError}</p>}
        <button
          type="button"
          onClick={onAdvance}
          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded"
        >
          {advanceLabel}
        </button>
      </div>
    );
  }

  if (phase === "lobby") {
    return (
      <>
        {connectError && (
          <p className="text-sm text-red-500 mb-3">{connectError}</p>
        )}
        <CallLobby
          personaName={simulation.persona_name}
          personaRole={simulation.persona_role}
          permissionError={videoCall.permissionError}
          canJoin={videoCall.canJoin}
          isPermissionPending={videoCall.permissionState === "pending"}
          studentVideoRef={videoCall.studentVideoRef}
          showStudentPip={showStudentPip}
          cameraUnavailable={videoCall.cameraUnavailable}
          onJoinCall={handleJoinCall}
        />
      </>
    );
  }

  return (
    <div className="relative min-h-[560px] rounded-xl overflow-hidden bg-[#0a0a0a] text-white">
      {mountSimli && (
        <div
          className={`absolute inset-0 z-0 ${
            phase === "connecting" ? "opacity-0" : "opacity-100"
          } [&>div]:!max-w-none [&>div]:!w-full [&>div]:!h-full [&>div]:!aspect-auto [&>div]:!rounded-none [&>div]:!shadow-none [&_video]:!h-full [&_video]:!w-full [&_video]:object-cover`}
        >
          <Avatar ref={voice.avatarRef} />
        </div>
      )}

      {phase === "connecting" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0a0a0a]/90">
          <div className="w-10 h-10 border-2 border-gray-600 border-t-green-500 rounded-full animate-spin" />
          <p className="mt-4 text-sm text-gray-300">
            Connecting to {simulation.persona_name}…
          </p>
        </div>
      )}

      {phase === "active" && (
        <>
          {showEndModal && (
            <EndCallModal
              personaName={simulation.persona_name}
              onConfirm={handleConfirmEndCall}
              onCancel={() => setShowEndModal(false)}
            />
          )}
          <CallLayout
            stageLabel={stageLabel}
            formattedTimer={videoCall.formattedTimer}
            personaName={simulation.persona_name}
            studentVideoRef={videoCall.studentVideoRef}
            showStudentPip={showStudentPip}
            cameraUnavailable={videoCall.cameraUnavailable}
            isMuted={videoCall.isMuted}
            isCameraOff={videoCall.isCameraOff}
            userTranscripts={voice.userTranscripts}
            personaTranscripts={voice.personaTranscripts}
            onToggleMute={videoCall.toggleMute}
            onToggleCamera={videoCall.toggleCamera}
            onEndCall={() => setShowEndModal(true)}
          />
          {scoreError && (
            <p className="absolute bottom-2 left-4 z-30 text-sm text-red-400">{scoreError}</p>
          )}
        </>
      )}
    </div>
  );
}
