/**
 * DiscoveryCallSession.tsx
 * Audio-only Simli voice call for Tempo Stage 2 Discovery.
 * Receives the microphone stream the student enabled in the lobby — it never
 * calls getUserMedia itself, so no device indicator turns on here. Bubbles
 * transcript, timer, and end-of-call data up to the parent DiscoveryStage.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import {
  formatDiscoveryTime,
  parseDiscoveryTranscript,
  type DiscoveryTranscriptEntry,
} from "@/lib/tempo-discovery";
import {
  DANA_REYES_SYSTEM_PROMPT,
  TEMPO_DISCOVERY_OPENING_GREETING,
  TEMPO_DISCOVERY_STAGE_HINT,
} from "@/lib/constants";
import { resumePlaybackContext } from "@/lib/audio-playback";
import { useSimulationVoiceSession } from "@/hooks/useSimulationVoiceSession";
import type { AvatarRef } from "@/types";

type DiscoveryCallSessionProps = {
  faceId: string;
  audioStream: MediaStream;
  onActive: () => void;
  onError: (message: string) => void;
  onTranscriptChange: (entries: DiscoveryTranscriptEntry[]) => void;
  onSecondsChange: (seconds: number) => void;
  onEnded: (
    transcriptText: string,
    seconds: number,
    entries: DiscoveryTranscriptEntry[]
  ) => void;
};

/**
 * Waits until Avatar imperative handle and media elements are ready.
 */
async function waitForAvatarReady(
  getRef: () => AvatarRef | null,
  maxMs = 8000
): Promise<AvatarRef | null> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const avatar = getRef();
    if (avatar) {
      const domReady = await avatar.waitForMediaElements(2000);
      if (domReady) {
        return avatar;
      }
    }
    await new Promise<void>((r) => setTimeout(r, 100));
  }
  return getRef();
}

/**
 * Mounts the voice session on the lobby-supplied stream and renders audio UI.
 */
export function DiscoveryCallSession({
  faceId,
  audioStream,
  onActive,
  onError,
  onTranscriptChange,
  onSecondsChange,
  onEnded,
}: DiscoveryCallSessionProps): React.ReactElement {
  const [connected, setConnected] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const connectStartedRef = useRef(false);
  const isMutedRef = useRef(false);
  const secondsRef = useRef(0);
  const activeAudioStreamRef = useRef(audioStream);

  const voice = useSimulationVoiceSession({
    systemPrompt: DANA_REYES_SYSTEM_PROMPT,
    stageHint: TEMPO_DISCOVERY_STAGE_HINT,
    openingGreeting: TEMPO_DISCOVERY_OPENING_GREETING,
    isMutedRef,
  });

  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  const callbacksRef = useRef({ onActive, onError });
  callbacksRef.current = { onActive, onError };

  // ── Connect once on mount (mic already granted in the lobby) ───
  useEffect(() => {
    if (connectStartedRef.current) {
      return;
    }
    connectStartedRef.current = true;

    const run = async (): Promise<void> => {
      await resumePlaybackContext();

      const avatar = await waitForAvatarReady(() => voiceRef.current.avatarRef.current);
      if (!avatar) {
        callbacksRef.current.onError("Could not connect to Dana Reyes. Reload and try again.");
        return;
      }

      avatar.resumeAudioContext();

      const simliReady = await avatar.startSession();
      if (!simliReady) {
        callbacksRef.current.onError(
          "Could not connect to Dana Reyes in time. Check Simli keys and try again."
        );
        return;
      }

      if (audioStream.getAudioTracks().length === 0) {
        callbacksRef.current.onError("Microphone stream unavailable. Reload and try again.");
        return;
      }

      try {
        await voiceRef.current.startCall(audioStream);
        // Kick playback again after the session is live (gesture may have been async).
        avatar.resumeAudioContext();
        await resumePlaybackContext();
        setConnected(true);
        callbacksRef.current.onActive();
      } catch {
        callbacksRef.current.onError("Could not start voice session. Reload and try again.");
      }
    };

    void run();
  }, [audioStream]);

  // ── Call timer (local) ───
  useEffect(() => {
    if (!connected) {
      return;
    }
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      secondsRef.current = elapsed;
      setSeconds(elapsed);
    }, 1000);
    return () => window.clearInterval(id);
  }, [connected]);

  useEffect(() => {
    onSecondsChange(seconds);
  }, [seconds, onSecondsChange]);

  // ── Bubble live transcript up to parent ───
  useEffect(() => {
    if (!connected) {
      return;
    }
    const raw = voiceRef.current.getFullTranscript();
    onTranscriptChange(parseDiscoveryTranscript(raw, secondsRef.current));
  }, [voice.userTranscripts, voice.personaTranscripts, connected, onTranscriptChange]);

  const toggleMute = useCallback((): void => {
    if (micMuted) {
      void (async (): Promise<void> => {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const track = micStream.getAudioTracks()[0];
          if (!track) {
            micStream.getTracks().forEach((t) => t.stop());
            return;
          }
          const nextStream = new MediaStream([track]);
          activeAudioStreamRef.current = nextStream;
          isMutedRef.current = false;
          setMicMuted(false);
          voiceRef.current.resumeMic(nextStream);
        } catch {
          /* stay muted */
        }
      })();
      return;
    }

    isMutedRef.current = true;
    setMicMuted(true);
    activeAudioStreamRef.current.getAudioTracks().forEach((track) => track.stop());
    voiceRef.current.pauseMic();
  }, [micMuted]);

  const handleEndCall = useCallback((): void => {
    const finalSeconds = secondsRef.current;
    voiceRef.current.endCall();
    activeAudioStreamRef.current.getTracks().forEach((track) => track.stop());
    const raw = voiceRef.current.getFullTranscript();
    const entries = parseDiscoveryTranscript(raw, finalSeconds);
    onEnded(raw, finalSeconds, entries);
  }, [onEnded]);

  return (
    <section className="flex-1 bg-[#0a0a0a] relative flex flex-col items-center justify-center p-lg min-w-0 overflow-hidden">
      {/*
        Keep Simli Avatar at a real size (off-screen) so WebRTC audio can play.
        A 1×1 / opacity-0 clip often mutes remote audio in Chromium/Safari.
      */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-0 h-[180px] w-[320px] -translate-x-full"
      >
        <div className="relative h-full w-full">
          <Avatar ref={voice.avatarRef} faceId={faceId} />
        </div>
      </div>

      {!connected ? (
        <div className="flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-tertiary-container rounded-full animate-spin" />
          <p className="mt-4 text-sm text-white/70">Connecting to Dana Reyes…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="w-32 h-32 rounded-full bg-primary-container flex items-center justify-center text-white font-display text-3xl border-4 border-white/20">
            DR
          </div>

          <div className="text-center">
            <p className="text-white font-headline-md">Dana Reyes</p>
            <p className="text-white/50 font-label-sm">
              Director of Operations · Summit Dental
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
            <MaterialIcon name="timer" className="text-white/60 text-[18px]" />
            <span className="font-code-md text-white/80">{formatDiscoveryTime(seconds)}</span>
          </div>
        </div>
      )}

      {/* Call controls (audio only: mic + end) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
        <nav className="rounded-full backdrop-blur-xl bg-black/20 border border-white/10 shadow-2xl flex items-center p-2 gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className={`p-3 rounded-full transition-all active:scale-90 ${
              micMuted ? "bg-error text-white" : "hover:bg-white/10 text-on-primary"
            }`}
          >
            <MaterialIcon name={micMuted ? "mic_off" : "mic"} />
          </button>
          <button
            type="button"
            onClick={handleEndCall}
            className="bg-error text-white rounded-full p-4 transition-all active:scale-90 shadow-lg"
          >
            <MaterialIcon name="call_end" filled />
          </button>
        </nav>
      </div>

      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/30 text-[10px]">
        This call is being recorded for scoring purposes
      </p>
    </section>
  );
}
