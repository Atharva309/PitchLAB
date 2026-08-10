/**
 * Avatar.tsx
 * Simli WebRTC video avatar: session init on user gesture, TTS decode, PCM worker, sendAudioData.
 * Exposes AvatarRef via forwardRef for useVoiceSession orchestration.
 */

"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  generateIceServers,
  generateSimliSessionToken,
  LogLevel,
  SimliClient,
} from "simli-client";
import {
  FLOAT_SAMPLES_PER_WORKER_CHUNK,
  PCM_CHUNK_SIZE,
  POST_CONNECT_ACK_WAIT_MS,
  SAMPLE_RATE_HZ,
  SIMLI_CONNECT_TIMEOUT_MS,
  SIMLI_FACE_ID,
  SIMLI_MAX_IDLE_TIME_SEC,
  SIMLI_MAX_SESSION_LENGTH_SEC,
} from "@/lib/constants";
import {
  CALL_PERSONA_VIDEO_CLASS,
  CALL_PERSONA_VIDEO_FRAME_CLASS,
  CALL_PERSONA_VIDEO_GRADIENT_CLASS,
} from "@/components/call/CallLayout";
import type { AvatarRef, SpeakAudioPayload } from "@/types";

// Re-export for consumers that imported AvatarRef from this module historically.
export type { AvatarRef } from "@/types";

/**
 * Linear resample mono Float32 from inputRate to outputRate.
 */
function resampleLinear(
  input: Float32Array,
  inputRate: number,
  outputRate: number
): Float32Array {
  if (inputRate === outputRate) {
    return input;
  }
  const ratio = inputRate / outputRate;
  const outLength = Math.max(1, Math.round(input.length / ratio));
  const out = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const srcPos = i * ratio;
    const i0 = Math.floor(srcPos);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const t = srcPos - i0;
    out[i] = input[i0] * (1 - t) + input[i1] * t;
  }
  return out;
}

/**
 * Decodes compressed audio to mono Float32 at SAMPLE_RATE_HZ (main thread only).
 */
async function decodeToMonoFloat16k(
  arrayBuffer: ArrayBuffer,
  audioContext: AudioContext
): Promise<Float32Array> {
  if (audioContext.sampleRate !== SAMPLE_RATE_HZ) {
    console.warn(
      `[Avatar] AudioContext sampleRate is ${audioContext.sampleRate}, expected ${SAMPLE_RATE_HZ}`
    );
  }

  const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
  const channelCount = decoded.numberOfChannels;
  const length = decoded.length;

  let samples: Float32Array;
  if (channelCount === 1) {
    samples = decoded.getChannelData(0);
  } else {
    samples = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (let c = 0; c < channelCount; c++) {
        sum += decoded.getChannelData(c)[i];
      }
      samples[i] = sum / channelCount;
    }
  }

  if (decoded.sampleRate !== SAMPLE_RATE_HZ) {
    samples = resampleLinear(samples, decoded.sampleRate, SAMPLE_RATE_HZ);
  }

  return samples;
}

/**
 * Posts a Float32 chunk to pcm-worker.js and resolves with PCM16 ArrayBuffer.
 */
function convertFloatChunkInWorker(worker: Worker, chunk: Float32Array): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const copy = new Float32Array(chunk.length);
    copy.set(chunk);

    const onMsg = (ev: MessageEvent<ArrayBuffer | null>): void => {
      worker.removeEventListener("message", onMsg);
      worker.removeEventListener("error", onErr);
      const buf = ev.data;
      if (!buf) {
        reject(new Error("PCM worker returned empty"));
      } else {
        resolve(buf);
      }
    };

    const onErr = (): void => {
      worker.removeEventListener("message", onMsg);
      worker.removeEventListener("error", onErr);
      reject(new Error("PCM worker error"));
    };

    worker.addEventListener("message", onMsg);
    worker.addEventListener("error", onErr);
    worker.postMessage(copy.buffer, [copy.buffer]);
  });
}

/**
 * Pushes PCM to Simli in a tight loop — no timers between calls.
 */
function sendPcmToSimli(
  client: SimliClient,
  pcmU8: Uint8Array,
  shouldAbort: () => boolean
): void {
  for (let i = 0; i < pcmU8.length; i += PCM_CHUNK_SIZE) {
    if (shouldAbort()) {
      return;
    }
    const end = Math.min(i + PCM_CHUNK_SIZE, pcmU8.length);
    client.sendAudioData(pcmU8.subarray(i, end));
  }
}

/**
 * Races a promise against a timeout for Simli connect.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId)) as Promise<T>;
}

/**
 * Best-effort autoplay for WebRTC video (Safari often needs a user gesture first).
 */
function kickMediaPlayback(video: HTMLVideoElement, audio: HTMLAudioElement | null): void {
  video.muted = true;
  void video.play().catch(() => {});
  if (audio) {
    audio.muted = false;
    audio.volume = 1;
    void audio.play().catch(() => {});
  }
}

type AvatarProps = {
  /** Per-simulation Simli face; falls back to NEXT_PUBLIC_SIMLI_FACE_ID when omitted. */
  faceId?: string;
};

export const Avatar = forwardRef<AvatarRef, AvatarProps>(function Avatar({ faceId }, ref) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const simliRef = useRef<SimliClient | null>(null);
  const decodeAudioContextRef = useRef<AudioContext | null>(null);
  const pcmWorkerRef = useRef<Worker | null>(null);
  const speakAbortRef = useRef(false);
  const isReadyRef = useRef(false);
  const sessionStartingRef = useRef(false);

  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  /**
   * Returns or creates the decode AudioContext at SAMPLE_RATE_HZ.
   */
  const ensureDecodeAudioContext = (): AudioContext => {
    const prev = decodeAudioContextRef.current;
    if (prev && prev.state !== "closed") {
      return prev;
    }

    if (prev?.state === "closed") {
      console.warn("[Avatar] Decode AudioContext was closed; creating a new one.");
    }

    const next = new AudioContext({
      sampleRate: SAMPLE_RATE_HZ,
      latencyHint: "playback",
    });
    decodeAudioContextRef.current = next;
    return next;
  };

  const stopSession = useCallback(async (): Promise<void> => {
    setIsReady(false);
    isReadyRef.current = false;
    setIsConnecting(false);

    const client = simliRef.current;
    simliRef.current = null;
    await client?.stop().catch(() => {});
  }, []);

  const waitForMediaElements = useCallback(async (maxMs = 5000): Promise<boolean> => {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      if (videoRef.current && audioRef.current) {
        return true;
      }
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
    }
    return videoRef.current !== null && audioRef.current !== null;
  }, []);

  const startSession = useCallback(async (): Promise<boolean> => {
    if (isReadyRef.current && simliRef.current) {
      return true;
    }
    if (sessionStartingRef.current) {
      const start = Date.now();
      while (sessionStartingRef.current && Date.now() - start < SIMLI_CONNECT_TIMEOUT_MS) {
        await new Promise<void>((resolve) => setTimeout(resolve, 200));
      }
      return isReadyRef.current && simliRef.current !== null;
    }

    const hasElements = await waitForMediaElements();
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!hasElements || !video || !audio) {
      setInitError("Video elements not ready. Try Join Call again.");
      return false;
    }

    sessionStartingRef.current = true;
    setIsConnecting(true);
    setInitError(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_SIMLI_API_KEY;
      const resolvedFaceId = faceId?.trim() || SIMLI_FACE_ID;

      if (!apiKey || !resolvedFaceId) {
        setInitError(
          "Add NEXT_PUBLIC_SIMLI_API_KEY and a Simli face ID on this simulation (or NEXT_PUBLIC_SIMLI_FACE_ID in .env.local)."
        );
        return false;
      }

      await stopSession();

      const tokenRes = await generateSimliSessionToken({
        apiKey,
        config: {
          faceId: resolvedFaceId,
          handleSilence: true,
          maxSessionLength: SIMLI_MAX_SESSION_LENGTH_SEC,
          maxIdleTime: SIMLI_MAX_IDLE_TIME_SEC,
        },
      });

      const sessionToken = tokenRes?.session_token;
      if (typeof sessionToken !== "string" || sessionToken.length === 0) {
        throw new Error(
          "Simli token response missing session_token — check API key and face ID."
        );
      }

      const iceServers = await generateIceServers(apiKey);

      const client = new SimliClient(
        sessionToken,
        video,
        audio,
        iceServers,
        LogLevel.ERROR,
        "livekit",
        "websockets",
        "wss://api.simli.ai"
      );

      client.on("error", (detail: unknown) => {
        console.error("Simli:", detail);
      });

      simliRef.current = client;
      kickMediaPlayback(video, audio);

      await withTimeout(
        client.start(),
        SIMLI_CONNECT_TIMEOUT_MS,
        `Simli did not connect within ${SIMLI_CONNECT_TIMEOUT_MS / 1000}s. Try Chrome, disable VPN/ad-block on api.simli.ai, confirm your face ID and API key, then reload.`
      );

      kickMediaPlayback(video, audio);

      await new Promise<void>((resolve) => {
        let settled = false;
        const done = (): void => {
          if (settled) {
            return;
          }
          settled = true;
          resolve();
        };
        client.on("ack", done);
        setTimeout(done, POST_CONNECT_ACK_WAIT_MS);
      });

      kickMediaPlayback(video, audio);
      requestAnimationFrame(() => kickMediaPlayback(video, audio));

      isReadyRef.current = true;
      setIsReady(true);
      return true;
    } catch (connectError) {
      console.error("Simli session failed:", connectError);
      await stopSession();

      const msg =
        connectError instanceof Error
          ? connectError.message
          : "Could not connect to Simli.";
      const hint =
        msg.includes("CONNECTION TIMED OUT") || msg.includes("timed out")
          ? `${msg} If this persists, try another network or browser (Safari sometimes blocks WebRTC until a user gesture — tap Join Call first).`
          : msg;
      setInitError(hint);
      return false;
    } finally {
      sessionStartingRef.current = false;
      setIsConnecting(false);
    }
  }, [faceId, stopSession, waitForMediaElements]);

  // ── Video inline playback (mobile Safari) ───────────────────────────────────

  useLayoutEffect(() => {
    const el = videoRef.current;
    if (!el) {
      return;
    }
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");
    el.muted = true;
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    const video = videoRef.current;
    const audio = audioRef.current;
    if (video) {
      kickMediaPlayback(video, audio);
    }
  }, [isReady]);

  // ── PCM worker lifecycle ────────────────────────────────────────────────────

  useEffect(() => {
    const worker = new Worker("/pcm-worker.js");
    pcmWorkerRef.current = worker;
    return () => {
      worker.terminate();
      pcmWorkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      void stopSession();
      const ctx = decodeAudioContextRef.current;
      decodeAudioContextRef.current = null;
      void ctx?.close().catch(() => {});
    };
  }, [stopSession]);

  useImperativeHandle(
    ref,
    (): AvatarRef => ({
      startSession,
      waitForMediaElements,
      isReady: (): boolean => isReadyRef.current,
      waitUntilReady: async (maxMs = SIMLI_CONNECT_TIMEOUT_MS): Promise<boolean> => {
        if (isReadyRef.current && simliRef.current) {
          return true;
        }
        const started = await startSession();
        if (started) {
          return true;
        }
        const start = Date.now();
        while (Date.now() - start < maxMs) {
          if (isReadyRef.current && simliRef.current) {
            return true;
          }
          await new Promise<void>((resolve) => setTimeout(resolve, 200));
        }
        return isReadyRef.current && simliRef.current !== null;
      },
      resumeAudioContext: (): void => {
        const ctx = decodeAudioContextRef.current ?? ensureDecodeAudioContext();
        if (ctx.state === "suspended") {
          void ctx.resume();
        }
        const video = videoRef.current;
        const audio = audioRef.current;
        if (video) {
          kickMediaPlayback(video, audio);
        }
      },
      stopSpeaking: (): void => {
        speakAbortRef.current = true;
        try {
          simliRef.current?.ClearBuffer();
        } catch {
          /* Simli may throw if not connected */
        }
      },
      speakAudio: async ({ audio }: SpeakAudioPayload): Promise<void> => {
        const client = simliRef.current;
        const worker = pcmWorkerRef.current;
        if (!client || !isReadyRef.current || !worker) {
          return;
        }

        speakAbortRef.current = false;

        const arrayBuffer = audio instanceof Blob ? await audio.arrayBuffer() : audio;
        const ctx = ensureDecodeAudioContext();
        if (ctx.state === "suspended") {
          await ctx.resume();
        }

        const samples = await decodeToMonoFloat16k(arrayBuffer, ctx);

        await new Promise<void>((resolve) => queueMicrotask(resolve));

        for (let off = 0; off < samples.length; off += FLOAT_SAMPLES_PER_WORKER_CHUNK) {
          if (speakAbortRef.current) {
            break;
          }

          const end = Math.min(off + FLOAT_SAMPLES_PER_WORKER_CHUNK, samples.length);
          const slice = samples.subarray(off, end);

          const pcmBuf = await convertFloatChunkInWorker(worker, slice);
          const pcmU8 = new Uint8Array(pcmBuf);

          sendPcmToSimli(client, pcmU8, () => speakAbortRef.current);

          await new Promise<void>((resolve) => queueMicrotask(resolve));
        }
      },
    }),
    [isReady, startSession, waitForMediaElements]
  );

  const showOverlay = initError !== null || isConnecting;

  return (
    <div className="absolute inset-0 bg-call-background">
      {showOverlay && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black/60 px-4 text-center text-sm text-gray-300">
          {initError ??
            (isConnecting ? "Connecting to Simli…" : "Tap Join Call to connect the avatar.")}
        </div>
      )}
      <div className={CALL_PERSONA_VIDEO_FRAME_CLASS}>
        <video
          ref={videoRef}
          className={CALL_PERSONA_VIDEO_CLASS}
          autoPlay
          playsInline
          muted
        />
        <div className={CALL_PERSONA_VIDEO_GRADIENT_CLASS} aria-hidden />
      </div>
      <audio
        ref={audioRef}
        className="absolute left-0 top-0 h-px w-px opacity-0"
        autoPlay
        playsInline
      />
    </div>
  );
});

Avatar.displayName = "Avatar";
