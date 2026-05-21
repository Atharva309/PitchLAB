/**
 * useProspectingVoice.ts
 * Voice-only prospecting stage: Deepgram STT + GPT + ElevenLabs TTS via HTML audio (no Simli).
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { base64ToArrayBuffer, pickMediaRecorderMimeType } from "@/lib/audio";
import {
  DEFAULT_OPENING_GREETING,
  MEDIA_RECORDER_TIMESLICE_MS,
  UTTERANCE_DEDUPE_MS,
} from "@/lib/constants";
import { createDeepgramConnection } from "@/lib/deepgram";
import type { ChatMessage, TtsResponseBody } from "@/types";

export type ProspectingVoiceConfig = {
  systemPrompt: string;
  openingGreeting?: string;
  personaName: string;
};

export type ProspectingVoiceReturn = {
  isActive: boolean;
  statusText: string;
  userTranscripts: string;
  personaTranscripts: string;
  getFullTranscript: () => string;
  startCall: () => Promise<void>;
  endCall: () => void;
};

/**
 * Prospecting phone-call hook without avatar — plays TTS through Audio element.
 */
export function useProspectingVoice(config: ProspectingVoiceConfig): ProspectingVoiceReturn {
  const [isActive, setIsActive] = useState(false);
  const [statusText, setStatusText] = useState("Tap Start Call to begin.");
  const [userTranscripts, setUserTranscripts] = useState("");
  const [personaTranscripts, setPersonaTranscripts] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const microphoneRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const deepgramConnectionRef = useRef<ReturnType<typeof createDeepgramConnection> | null>(null);
  const isSpeakingRef = useRef(false);
  const recentVoiceUtteranceRef = useRef<{ text: string; at: number } | null>(null);
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

  const playTts = useCallback(
    async (text: string): Promise<void> => {
      setPersonaTranscripts(text);
      appendLine(configRef.current.personaName, text);
      isSpeakingRef.current = true;
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
        if (!data.audioBase64) return;

        const buffer = base64ToArrayBuffer(data.audioBase64);
        const blob = new Blob([buffer], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        const audio = audioRef.current ?? new Audio(url);
        audioRef.current = audio;
        await new Promise<void>((resolve, reject) => {
          audio.onended = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          audio.onerror = () => reject(new Error("Audio playback failed"));
          void audio.play().catch(reject);
        });
      } catch (err) {
        console.error(err);
        setStatusText("Voice playback failed.");
      } finally {
        if (epoch === playbackEpochRef.current) {
          isSpeakingRef.current = false;
          setStatusText("Listening...");
        }
      }
    },
    [appendLine]
  );

  const handleUserSentence = useCallback(
    async (text: string): Promise<void> => {
      if (isSpeakingRef.current) return;
      setUserTranscripts(text);
      appendLine("Student", text);
      setStatusText("Thinking...");

      try {
        const chatRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messagesRef.current,
            newMessage: text,
            systemPrompt: configRef.current.systemPrompt,
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
      }
    },
    [playTts, appendLine]
  );

  const startCall = useCallback(async (): Promise<void> => {
    let stream: MediaStream | null = null;
    try {
      setIsActive(true);
      setStatusText(`Calling ${configRef.current.personaName}...`);
      setMessages([]);
      messagesRef.current = [];
      transcriptLinesRef.current = [];

      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneRef.current = stream;
      const connection = createDeepgramConnection();
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
        if (mediaRecorder.state === "inactive") mediaRecorder.start(MEDIA_RECORDER_TIMESLICE_MS);
        setStatusText("Connected.");
        void playTts(greeting);
      });

      connection.onTranscript((sentence: string, done: boolean): void => {
        if (isSpeakingRef.current || !done || !sentence.trim()) return;
        const now = Date.now();
        const prev = recentVoiceUtteranceRef.current;
        if (prev && sentence === prev.text && now - prev.at < UTTERANCE_DEDUPE_MS) return;
        recentVoiceUtteranceRef.current = { text: sentence, at: now };
        void handleUserSentence(sentence);
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
    mediaRecorderRef.current?.stop();
    microphoneRef.current?.getTracks().forEach((t) => t.stop());
    deepgramConnectionRef.current?.close();
    setIsActive(false);
    setStatusText("Call ended.");
  }, []);

  return {
    isActive,
    statusText,
    userTranscripts,
    personaTranscripts,
    getFullTranscript: () => transcriptLinesRef.current.join("\n"),
    startCall,
    endCall,
  };
}
