/**
 * useAudioWaveform.ts
 * Drives a live microphone level visualisation for phone-call stages via AnalyserNode.
 */

"use client";

import { useEffect, useRef, useState } from "react";

export type UseAudioWaveformReturn = {
  /** Normalised bar heights 0–1 for rendering a waveform (length = barCount). */
  levels: number[];
};

const DEFAULT_BAR_COUNT = 24;

/**
 * Samples audio levels from a MediaStream for animated waveform UI.
 *
 * @param stream - Active microphone stream; null before join or after teardown.
 * @param barCount - Number of bars in the visualisation.
 * @returns Array of normalised levels updated on requestAnimationFrame.
 */
export function useAudioWaveform(
  stream: MediaStream | null,
  barCount: number = DEFAULT_BAR_COUNT
): UseAudioWaveformReturn {
  const [levels, setLevels] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => 0.08)
  );
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      setLevels(Array.from({ length: barCount }, () => 0.08));
      return;
    }

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;

    try {
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
    } catch {
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);

    const tick = (): void => {
      if (!analyser) return;
      analyser.getByteFrequencyData(data);

      const bucketSize = Math.max(1, Math.floor(bufferLength / barCount));
      const next = Array.from({ length: barCount }, (_, i) => {
        const start = i * bucketSize;
        const end = Math.min(start + bucketSize, bufferLength);
        let sum = 0;
        for (let j = start; j < end; j++) {
          sum += data[j];
        }
        const avg = sum / (end - start);
        return Math.max(0.08, avg / 255);
      });

      setLevels(next);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      source?.disconnect();
      void audioContext?.close();
    };
  }, [stream, barCount]);

  return { levels };
}
