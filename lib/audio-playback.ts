/**
 * audio-playback.ts
 * Plays ElevenLabs base64 audio via Web Audio — serializes clips so replies always play.
 */

import { base64ToArrayBuffer } from "@/lib/audio";

let sharedContext: AudioContext | null = null;
let activeSource: AudioBufferSourceNode | null = null;
let playQueue: Promise<void> = Promise.resolve();

/**
 * Resumes the shared AudioContext — call from a user gesture (e.g. Start Call).
 */
export async function resumePlaybackContext(): Promise<void> {
  const ctx = getPlaybackContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
}

/**
 * Returns or creates a shared AudioContext for TTS playback.
 */
function getPlaybackContext(): AudioContext {
  if (!sharedContext || sharedContext.state === "closed") {
    sharedContext = new AudioContext();
  }
  return sharedContext;
}

/**
 * Stops any in-flight TTS clip before starting another.
 */
function stopActiveSource(): void {
  if (!activeSource) return;
  try {
    activeSource.stop();
  } catch {
    /* already stopped */
  }
  activeSource.disconnect();
  activeSource = null;
}

/**
 * Decodes and plays one base64 clip; resolves when playback ends.
 */
async function playOnce(audioBase64: string): Promise<void> {
  const arrayBuffer = base64ToArrayBuffer(audioBase64);
  const ctx = getPlaybackContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  stopActiveSource();

  const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
  const source = ctx.createBufferSource();
  source.buffer = decoded;
  source.connect(ctx.destination);
  activeSource = source;

  await new Promise<void>((resolve, reject) => {
    source.onended = () => {
      if (activeSource === source) {
        activeSource = null;
      }
      resolve();
    };
    try {
      source.start(0);
    } catch (startError) {
      reject(startError instanceof Error ? startError : new Error("Could not start audio"));
    }
  });
}

/**
 * Decodes and plays base64 audio (mp3/wav from ElevenLabs); queues so replies are not dropped.
 */
export async function playBase64Speech(audioBase64: string): Promise<void> {
  const run = playQueue.then(() => playOnce(audioBase64));
  playQueue = run.catch(() => undefined);
  await run;
}

/**
 * Stops queued/playing prospecting TTS (e.g. when ending the call).
 */
export function stopBase64Speech(): void {
  stopActiveSource();
  playQueue = Promise.resolve();
}
