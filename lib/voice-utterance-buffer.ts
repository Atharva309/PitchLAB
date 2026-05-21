/**
 * voice-utterance-buffer.ts
 * Debounces Deepgram finals so the student can finish speaking before GPT/TTS runs.
 * Used by useProspectingVoice and useSimulationVoiceSession.
 */

import { DEBOUNCE_MS } from "@/lib/constants";

export type UtteranceBufferHandlers = {
  onLivePreview: (preview: string) => void;
  onCommit: (fullUtterance: string) => void;
};

export type UtteranceBuffer = {
  pushFragment: (fragment: string, isSpeechFinal: boolean) => void;
  reset: () => void;
  cancel: () => void;
};

/**
 * Creates a buffer that accumulates is_final fragments and commits after silence.
 * @param handlers - Live preview + commit callbacks
 * @param debounceMs - ms of silence after last fragment before commit
 */
export function createUtteranceBuffer(
  handlers: UtteranceBufferHandlers,
  debounceMs: number = DEBOUNCE_MS
): UtteranceBuffer {
  let accumulated = "";
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = (): void => {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };

  const commit = (): void => {
    clearTimer();
    const text = accumulated.trim();
    accumulated = "";
    if (text.length > 0) {
      handlers.onCommit(text);
    }
    handlers.onLivePreview("");
  };

  const scheduleCommit = (): void => {
    clearTimer();
    debounceTimer = setTimeout(commit, debounceMs);
  };

  return {
    pushFragment: (fragment: string, isSpeechFinal: boolean): void => {
      const trimmed = fragment.trim();
      if (trimmed.length === 0) {
        return;
      }

      accumulated = accumulated.length > 0 ? `${accumulated} ${trimmed}` : trimmed;
      handlers.onLivePreview(accumulated);

      if (isSpeechFinal) {
        commit();
      } else {
        scheduleCommit();
      }
    },
    reset: (): void => {
      clearTimer();
      accumulated = "";
      handlers.onLivePreview("");
    },
    cancel: (): void => {
      clearTimer();
      accumulated = "";
      handlers.onLivePreview("");
    },
  };
}
