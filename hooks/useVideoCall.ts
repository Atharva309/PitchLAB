/**
 * useVideoCall.ts
 * Manages student camera/microphone for video-call stages: permissions, PiP stream,
 * mute/camera toggles, call timer, and full track cleanup on end or unmount.
 * Splits video (PiP) and audio (Deepgram) into separate MediaStreams.
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
  canJoin: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  cameraUnavailable: boolean;
  /** Audio-only stream for Deepgram MediaRecorder — never attach to a video element. */
  audioStream: MediaStream | null;
  /** Callback ref — assigns video-only stream to PiP when the element mounts. */
  studentVideoRef: React.RefCallback<HTMLVideoElement | null>;
  isMutedRef: React.MutableRefObject<boolean>;
  elapsedSeconds: number;
  formattedTimer: string;
  toggleMute: () => void;
  toggleCamera: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  stopAllTracks: () => void;
};

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Requests camera + microphone on mount, exposes PiP preview and in-call controls.
 */
export function useVideoCall(options: UseVideoCallOptions = {}): UseVideoCallReturn {
  const withVideo = options.withVideo !== false;

  const [permissionState, setPermissionState] = useState<MediaPermissionState>("pending");
  const [permissionError, setPermissionError] = useState("");
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [hasVideoPreview, setHasVideoPreview] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const rawStreamRef = useRef<MediaStream | null>(null);
  const videoPreviewStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const isMutedRef = useRef(false);
  const timerIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Binds the video-only preview stream to whichever PiP element is mounted.
   */
  const attachVideoPreview = useCallback((): void => {
    const video = videoElementRef.current;
    const preview = videoPreviewStreamRef.current;
    if (video && preview) {
      if (video.srcObject !== preview) {
        video.srcObject = preview;
      }
      void video.play().catch(() => {});
    }
  }, []);

  const studentVideoRef = useCallback(
    (node: HTMLVideoElement | null): void => {
      videoElementRef.current = node;
      if (node) {
        attachVideoPreview();
      }
    },
    [attachVideoPreview]
  );

  useEffect(() => {
    attachVideoPreview();
  }, [hasVideoPreview, attachVideoPreview]);

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

        rawStreamRef.current = mediaStream;

        const audioTrack = mediaStream.getAudioTracks()[0];
        if (audioTrack) {
          const audioOnly = new MediaStream([audioTrack]);
          audioStreamRef.current = audioOnly;
          setAudioStream(audioOnly);
        }

        const videoTrack = mediaStream.getVideoTracks()[0];
        if (withVideo && videoTrack) {
          const videoOnly = new MediaStream([videoTrack]);
          videoPreviewStreamRef.current = videoOnly;
          setHasVideoPreview(true);
          attachVideoPreview();
        } else if (withVideo) {
          setCameraUnavailable(true);
        }

        if (!audioTrack) {
          setPermissionState("mic_denied");
          setPermissionError(
            "Microphone access is required to join the call. Enable it in your browser settings and reload."
          );
          return;
        }

        setPermissionState("ready");
        setPermissionError("");
      } catch (err) {
        if (cancelled) return;

        const message =
          err instanceof Error ? err.message : "Could not access camera or microphone.";
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
      rawStreamRef.current?.getTracks().forEach((track) => track.stop());
      rawStreamRef.current = null;
      videoPreviewStreamRef.current = null;
      audioStreamRef.current = null;
    };
  }, [withVideo, attachVideoPreview]);

  useEffect(() => {
    isMutedRef.current = isMuted;
    const audioTrack = audioStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    const videoTrack = rawStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !isCameraOff;
    }
    const video = videoElementRef.current;
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
    rawStreamRef.current?.getTracks().forEach((track) => track.stop());
    rawStreamRef.current = null;
    videoPreviewStreamRef.current = null;
    audioStreamRef.current = null;
    setAudioStream(null);
    setHasVideoPreview(false);
    const video = videoElementRef.current;
    if (video) {
      video.srcObject = null;
    }
  }, [stopTimer]);

  const canJoin = permissionState === "ready" && audioStreamRef.current !== null;

  return {
    permissionState,
    permissionError,
    canJoin,
    isMuted,
    isCameraOff,
    cameraUnavailable,
    audioStream,
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
