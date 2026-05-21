/**
 * audio.ts
 * Browser audio helpers: MediaRecorder MIME selection and base64 decode.
 * Used by useVoiceSession (mic → Deepgram) and Avatar (TTS playback).
 */

/**
 * Picks the best supported MIME type for MediaRecorder across browsers.
 * @returns MIME string or undefined if MediaRecorder is unavailable
 */
export function pickMediaRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") {
    return undefined;
  }

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];

  for (const mimeType of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    } catch {
      /* browser may throw on isTypeSupported for unknown types */
    }
  }

  return undefined;
}

/**
 * Decodes a base64 string (from /api/tts) into an ArrayBuffer for Web Audio.
 * @param base64 - Raw base64 audio payload from ElevenLabs
 * @returns ArrayBuffer suitable for decodeAudioData
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
