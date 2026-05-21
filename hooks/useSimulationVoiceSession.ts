/**
 * useSimulationVoiceSession.ts
 * Simli avatar voice stages with debounced STT so the persona waits for the student.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { base64ToArrayBuffer, pickMediaRecorderMimeType } from "@/lib/audio";
import {
  DEFAULT_OPENING_GREETING,
  MEDIA_RECORDER_TIMESLICE_MS,
  POST_SPEAK_COOLDOWN_MS,
  VOICE_ENDPOINTING_MS,
  VOICE_UTTERANCE_END_MS,
} from "@/lib/constants";
import { createDeepgramConnection } from "@/lib/deepgram";
import { buildVoiceSystemPrompt } from "@/lib/persona-voice";
import { createUtteranceBuffer } from "@/lib/voice-utterance-buffer";
import type { AvatarRef, ChatMessage, TtsResponseBody } from "@/types";

export type SimulationVoiceConfig = {
  systemPrompt: string;
  openingGreeting?: string;
  stageHint?: string;
};

export type SimulationVoiceReturn = {
  avatarRef: React.RefObject<AvatarRef>;
  isActive: boolean;
  statusText: string;
  userTranscripts: string;
  personaTranscripts: string;
  getFullTranscript: () => string;
  startCall: () => Promise<void>;
  endCall: () => void;
};

/**
 * Voice hook with Simli playback and turn-taking for discovery / objections.
 */
export function useSimulationVoiceSession(
  config: SimulationVoiceConfig
): SimulationVoiceReturn {
  const [isActive, setIsActive] = useState(false);
  const [statusText, setStatusText] = useState("Ready to start.");
  const [userTranscripts, setUserTranscripts] = useState("");
  const [personaTranscripts, setPersonaTranscripts] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const avatarRef = useRef<AvatarRef>(null);
  const microphoneRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const deepgramConnectionRef = useRef<ReturnType<typeof createDeepgramConnection> | null>(null);
  const utteranceBufferRef = useRef<ReturnType<typeof createUtteranceBuffer> | null>(null);
  const isSpeakingRef = useRef(false);
  const isProcessingUserRef = useRef(false);
  const canListenAfterRef = useRef(0);
  const playbackEpochRef = useRef(0);
  const messagesRef = useRef<ChatMessage[]>([]);
  const transcriptLinesRef = useRef<string[]>([]);
  const isActiveRef = useRef(false);
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const appendTranscript = useCallback((speaker: string, text: string): void => {
    transcriptLinesRef.current.push(`${speaker}: ${text}`);
  }, []);

  const canAcceptStudentSpeech = useCallback((): boolean => {
    return (
      !isSpeakingRef.current &&
      !isProcessingUserRef.current &&
      Date.now() >= canListenAfterRef.current
    );
  }, []);

  const speakFromApi = useCallback(
    async (text: string): Promise<void> => {
      setPersonaTranscripts(text);
      appendTranscript("Persona", text);
      isSpeakingRef.current = true;
      utteranceBufferRef.current?.cancel();
      const epoch = playbackEpochRef.current;

      try {
        const ttsRes = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (epoch !== playbackEpochRef.current) return;

        if (!ttsRes.ok) {
          const errBody = (await ttsRes.json().catch(() => ({}))) as { error?: string };
          throw new Error(errBody.error ?? `TTS failed (${ttsRes.status})`);
        }

        const data = (await ttsRes.json()) as TtsResponseBody;
        if (!data.audioBase64 || epoch !== playbackEpochRef.current) return;

        const buffer = base64ToArrayBuffer(data.audioBase64);
        if (avatarRef.current && epoch === playbackEpochRef.current) {
          await avatarRef.current.speakAudio({ audio: buffer });
        }
      } catch (err) {
        console.error(err);
        setStatusText(err instanceof Error ? err.message : "Voice playback failed.");
      } finally {
        if (epoch === playbackEpochRef.current) {
          isSpeakingRef.current = false;
          canListenAfterRef.current = Date.now() + POST_SPEAK_COOLDOWN_MS;
          setStatusText(isActiveRef.current ? "Your turn — speak when ready." : "Ready.");
        }
      }
    },
    [appendTranscript]
  );

  const handleUserSentence = useCallback(
    async (text: string): Promise<void> => {
      if (!canAcceptStudentSpeech()) return;

      isProcessingUserRef.current = true;
      setUserTranscripts(text);
      appendTranscript("Student", text);
      setStatusText("Thinking...");

      const prior = messagesRef.current;
      try {
        const systemPrompt = buildVoiceSystemPrompt(
          configRef.current.systemPrompt,
          configRef.current.stageHint
        );
        const chatRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: prior,
            newMessage: text,
            systemPrompt,
          }),
        });

        if (!chatRes.ok) {
          const errBody = (await chatRes.json().catch(() => ({}))) as { error?: string };
          throw new Error(errBody.error ?? `Chat failed (${chatRes.status})`);
        }

        const { reply } = (await chatRes.json()) as { reply: string };
        const next: ChatMessage[] = [
          ...prior,
          { role: "user", content: text },
          { role: "assistant", content: reply },
        ];
        setMessages(next);
        messagesRef.current = next;
        await speakFromApi(reply);
      } catch (err) {
        console.error(err);
        setStatusText(err instanceof Error ? err.message : "Could not get reply.");
      } finally {
        isProcessingUserRef.current = false;
      }
    },
    [speakFromApi, appendTranscript, canAcceptStudentSpeech]
  );

  const startCall = useCallback(async (): Promise<void> => {
    let stream: MediaStream | null = null;
    try {
      setIsActive(true);
      setStatusText("Connecting...");
      setMessages([]);
      messagesRef.current = [];
      transcriptLinesRef.current = [];
      setUserTranscripts("");
      setPersonaTranscripts("");
      canListenAfterRef.current = Date.now() + POST_SPEAK_COOLDOWN_MS;

      utteranceBufferRef.current = createUtteranceBuffer({
        onLivePreview: (preview) => setUserTranscripts(preview),
        onCommit: (full) => void handleUserSentence(full),
      });

      avatarRef.current?.resumeAudioContext();
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneRef.current = stream;

      const connection = createDeepgramConnection({
        endpointing: VOICE_ENDPOINTING_MS,
        utterance_end_ms: VOICE_UTTERANCE_END_MS,
      });

      const mimeType = pickMediaRecorderMimeType();
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event: BlobEvent): void => {
        if (event.data.size > 0) connection.send(event.data);
      };
      mediaRecorderRef.current = mediaRecorder;
      deepgramConnectionRef.current = connection;

      const greeting = configRef.current.openingGreeting ?? DEFAULT_OPENING_GREETING;

      connection.onOpen(() => {
        if (mediaRecorder.state === "inactive") {
          mediaRecorder.start(MEDIA_RECORDER_TIMESLICE_MS);
        }
        setStatusText("Connected — listen, then speak.");
        void speakFromApi(greeting);
      });

      connection.onTranscript((sentence: string, meta): void => {
        if (!canAcceptStudentSpeech()) return;

        if (!meta.isFinal && !meta.isSpeechFinal) {
          setUserTranscripts(sentence);
          return;
        }

        if (meta.isFinal || meta.isSpeechFinal) {
          utteranceBufferRef.current?.pushFragment(sentence, meta.isSpeechFinal);
        }
      });

      connection.onError(() => {
        setStatusText("Speech service error — check Deepgram API key.");
      });
    } catch (err) {
      console.error(err);
      stream?.getTracks().forEach((t) => t.stop());
      setStatusText(
        err instanceof Error ? err.message : "Microphone access denied or connection failed."
      );
      setIsActive(false);
    }
  }, [handleUserSentence, speakFromApi, canAcceptStudentSpeech]);

  const endCall = useCallback((): void => {
    playbackEpochRef.current += 1;
    isSpeakingRef.current = false;
    isProcessingUserRef.current = false;
    utteranceBufferRef.current?.cancel();
    avatarRef.current?.stopSpeaking();
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    microphoneRef.current?.getTracks().forEach((t) => t.stop());
    microphoneRef.current = null;
    deepgramConnectionRef.current?.close();
    deepgramConnectionRef.current = null;
    setIsActive(false);
    setStatusText("Session ended.");
  }, []);

  return {
    avatarRef,
    isActive,
    statusText,
    userTranscripts,
    personaTranscripts,
    getFullTranscript: () => transcriptLinesRef.current.join("\n"),
    startCall,
    endCall,
  };
}
