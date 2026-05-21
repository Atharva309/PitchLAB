/**
 * useProspectingVoice.ts
 * Voice-only stages: Deepgram STT + GPT + ElevenLabs via Web Audio (no Simli).
 * Debounces student speech so the persona does not interrupt mid-utterance.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { playBase64Speech, resumePlaybackContext, stopBase64Speech } from "@/lib/audio-playback";
import { pickMediaRecorderMimeType } from "@/lib/audio";
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
import type { ChatMessage, TtsResponseBody } from "@/types";

export type ProspectingVoiceConfig = {
  systemPrompt: string;
  openingGreeting?: string;
  personaName: string;
  stageHint?: string;
};

export type ProspectingVoiceReturn = {
  isActive: boolean;
  statusText: string;
  userTranscripts: string;
  personaTranscripts: string;
  getFullTranscript: () => string;
  startCall: () => Promise<void>;
  stopListening: () => void;
  endCall: () => void;
};

/**
 * Prospecting phone-call hook — plays TTS through Web Audio decode.
 */
export function useProspectingVoice(config: ProspectingVoiceConfig): ProspectingVoiceReturn {
  const [isActive, setIsActive] = useState(false);
  const [statusText, setStatusText] = useState("Tap Start Call to begin.");
  const [userTranscripts, setUserTranscripts] = useState("");
  const [personaTranscripts, setPersonaTranscripts] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

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
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const appendLine = useCallback((speaker: string, text: string): void => {
    transcriptLinesRef.current.push(`${speaker}: ${text}`);
  }, []);

  /**
   * True when student speech can be sent to GPT (not during persona TTS or processing).
   */
  const canAcceptStudentSpeech = (): boolean => {
    return (
      !isSpeakingRef.current &&
      !isProcessingUserRef.current &&
      Date.now() >= canListenAfterRef.current
    );
  };

  const playTts = useCallback(
    async (text: string): Promise<void> => {
      setPersonaTranscripts(text);
      appendLine(configRef.current.personaName, text);
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
        if (!ttsRes.ok) throw new Error("TTS failed");

        const data = (await ttsRes.json()) as TtsResponseBody;
        if (!data.audioBase64) {
          setStatusText("No audio returned from voice service.");
          return;
        }

        await playBase64Speech(data.audioBase64);
      } catch (err) {
        console.error(err);
        setStatusText(err instanceof Error ? err.message : "Voice playback failed.");
      } finally {
        if (epoch === playbackEpochRef.current) {
          isSpeakingRef.current = false;
          canListenAfterRef.current = Date.now() + POST_SPEAK_COOLDOWN_MS;
          setStatusText("Your turn — speak when ready.");
        }
      }
    },
    [appendLine]
  );

  const handleUserSentence = useCallback(
    async (text: string): Promise<void> => {
      if (!canAcceptStudentSpeech()) return;

      isProcessingUserRef.current = true;
      setUserTranscripts(text);
      appendLine("Student", text);
      setStatusText("Thinking...");

      try {
        const systemPrompt = buildVoiceSystemPrompt(
          configRef.current.systemPrompt,
          configRef.current.stageHint
        );
        const chatRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messagesRef.current,
            newMessage: text,
            systemPrompt,
          }),
        });
        if (!chatRes.ok) throw new Error("Chat failed");
        const { reply } = (await chatRes.json()) as { reply: string };
        const next: ChatMessage[] = [
          ...messagesRef.current,
          { role: "user", content: text },
          { role: "assistant", content: reply },
        ];
        setMessages(next);
        messagesRef.current = next;
        await playTts(reply);
      } catch (err) {
        setStatusText(err instanceof Error ? err.message : "Chat error.");
      } finally {
        isProcessingUserRef.current = false;
      }
    },
    [playTts, appendLine]
  );

  const stopListening = useCallback((): void => {
    utteranceBufferRef.current?.cancel();
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    microphoneRef.current?.getTracks().forEach((t) => t.stop());
    microphoneRef.current = null;
    deepgramConnectionRef.current?.close();
    deepgramConnectionRef.current = null;
    setIsActive(false);
    setStatusText("Call ended.");
  }, []);

  const startCall = useCallback(async (): Promise<void> => {
    let stream: MediaStream | null = null;
    try {
      await resumePlaybackContext();
      setIsActive(true);
      setStatusText(`Calling ${configRef.current.personaName}...`);
      setMessages([]);
      messagesRef.current = [];
      transcriptLinesRef.current = [];
      canListenAfterRef.current = Date.now() + POST_SPEAK_COOLDOWN_MS;

      utteranceBufferRef.current = createUtteranceBuffer({
        onLivePreview: (preview) => setUserTranscripts(preview),
        onCommit: (full) => void handleUserSentence(full),
      });

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

      mediaRecorder.ondataavailable = (e: BlobEvent): void => {
        if (e.data.size > 0) connection.send(e.data);
      };
      mediaRecorderRef.current = mediaRecorder;
      deepgramConnectionRef.current = connection;

      const greeting = configRef.current.openingGreeting ?? DEFAULT_OPENING_GREETING;

      connection.onOpen(() => {
        if (mediaRecorder.state === "inactive") {
          mediaRecorder.start(MEDIA_RECORDER_TIMESLICE_MS);
        }
        setStatusText("Connected — listen, then speak.");
        void playTts(greeting);
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
    } catch (err) {
      stream?.getTracks().forEach((t) => t.stop());
      setStatusText("Could not start call.");
      setIsActive(false);
    }
  }, [handleUserSentence, playTts]);

  const endCall = useCallback((): void => {
    playbackEpochRef.current += 1;
    isSpeakingRef.current = false;
    isProcessingUserRef.current = false;
    stopBase64Speech();
    stopListening();
  }, [stopListening]);

  return {
    isActive,
    statusText,
    userTranscripts,
    personaTranscripts,
    getFullTranscript: () => transcriptLinesRef.current.join("\n"),
    startCall,
    stopListening,
    endCall,
  };
}
