/**
 * useVideoCall.ts
 * Manages student camera/microphone for video-call stages: permissions, PiP stream,
 * mute/camera toggles, call timer, and full track cleanup on end or unmount.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MediaPermissionState = "pending" | "ready" | "mic_denied" | "error";

export type UseVideoCallOptions = {
  /** When false, only microphone is requested (phone / prospecting stages). */
  withVideo?: boolean;
};

export type UseVideoCallReturn = {
  permissionState: MediaPermissionState;
  permissionError: string;
  /** False when microphone was denied — Join Call must stay disabled. */
  canJoin: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  cameraUnavailable: boolean;
  stream: MediaStream | null;
  studentVideoRef: React.RefObject<HTMLVideoElement>;
  isMutedRef: React.MutableRefObject<boolean>;
  elapsedSeconds: number;
  formattedTimer: string;
  toggleMute: () => void;
  toggleCamera: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  /** Stops all media tracks and clears the stream reference. */
  stopAllTracks: () => void;
};

/**
 * Formats elapsed seconds as M:SS for the call header timer.
 */
function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Requests camera + microphone on mount, exposes PiP preview and in-call controls.
 *
 * @param options - Pass `withVideo: false` for audio-only prospecting calls.
 * @returns Stream refs, permission state, mute/camera toggles, and cleanup helpers.
 */
export function useVideoCall(options: UseVideoCallOptions = {}): UseVideoCallReturn {
  const withVideo = options.withVideo !== false;

  const [permissionState, setPermissionState] = useState<MediaPermissionState>("pending");
  const [permissionError, setPermissionError] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const studentVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMutedRef = useRef(false);
  const timerIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Binds the live MediaStream to the PiP video element when available.
   */
  const attachPreview = useCallback((mediaStream: MediaStream): void => {
    const video = studentVideoRef.current;
    if (video) {
      video.srcObject = mediaStream;
      void video.play().catch(() => {});
    }
  }, []);

  /**
   * Requests getUserMedia once on mount for lobby preview and later Deepgram capture.
   */
  useEffect(() => {
    let cancelled = false;

    const requestMedia = async (): Promise<void> => {
      try {
        const constraints: MediaStreamConstraints = withVideo
          ? { video: true, audio: true }
          : { video: false, audio: true };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

        if (cancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = mediaStream;
        setStream(mediaStream);
        attachPreview(mediaStream);

        const hasAudio = mediaStream.getAudioTracks().length > 0;
        if (!hasAudio) {
          setPermissionState("mic_denied");
          setPermissionError(
            "Microphone access is required to join the call. Enable it in your browser settings and reload."
          );
          return;
        }

        if (withVideo && mediaStream.getVideoTracks().length === 0) {
          setCameraUnavailable(true);
        }

        setPermissionState("ready");
        setPermissionError("");
      } catch (err) {
        if (cancelled) return;

        const message = err instanceof Error ? err.message : "Could not access camera or microphone.";
        const isMicIssue =
          message.toLowerCase().includes("audio") ||
          message.toLowerCase().includes("microphone") ||
          message.toLowerCase().includes("notallowed");

        if (!withVideo || isMicIssue) {
          setPermissionState("mic_denied");
          setPermissionError(
            "Microphone access is required to join the call. Allow microphone access and reload."
          );
        } else {
          setPermissionState("error");
          setPermissionError(message);
          setCameraUnavailable(true);
        }
      }
    };

    void requestMedia();

    return () => {
      cancelled = true;
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [withVideo, attachPreview]);

  useEffect(() => {
    if (stream) {
      attachPreview(stream);
    }
  }, [stream, attachPreview]);

  useEffect(() => {
    isMutedRef.current = isMuted;
    const audioTrack = streamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !isCameraOff;
    }
    const video = studentVideoRef.current;
    if (video) {
      video.style.opacity = isCameraOff ? "0" : "1";
    }
  }, [isCameraOff]);

  const toggleMute = useCallback((): void => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleCamera = useCallback((): void => {
    if (cameraUnavailable) return;
    setIsCameraOff((prev) => !prev);
  }, [cameraUnavailable]);

  const startTimer = useCallback((): void => {
    if (timerIdRef.current) return;
    setElapsedSeconds(0);
    timerIdRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback((): void => {
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
  }, []);

  const stopAllTracks = useCallback((): void => {
    stopTimer();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    const video = studentVideoRef.current;
    if (video) {
      video.srcObject = null;
    }
  }, [stopTimer]);

  const canJoin = permissionState === "ready";

  return {
    permissionState,
    permissionError,
    canJoin,
    isMuted,
    isCameraOff,
    cameraUnavailable,
    stream,
    studentVideoRef,
    isMutedRef,
    elapsedSeconds,
    formattedTimer: formatElapsed(elapsedSeconds),
    toggleMute,
    toggleCamera,
    startTimer,
    stopTimer,
    stopAllTracks,
  };
}
