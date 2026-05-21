/**
 * elevenLabsTimings.ts
 * Converts ElevenLabs alignment data into word and character timing arrays.
 * Called by /api/tts after receiving the with-timestamps response.
 */

import type { ElevenLabsAlignment, LipSyncTiming } from "@/types";

/**
 * Returns an empty timing structure when alignment is missing or invalid.
 */
function buildEmptyTiming(): LipSyncTiming {
  return {
    words: [],
    wtimes: [],
    wdurations: [],
    chars: [],
    ctimes: [],
    cdurations: [],
  };
}

/**
 * Converts ElevenLabs alignment data into word and character timing arrays.
 * @param alignment - Raw alignment object from ElevenLabs API
 * @returns Structured timing arrays for avatar lip sync metadata
 */
export function timingsFromAlignment(alignment: unknown): LipSyncTiming {
  const words: string[] = [];
  const wtimes: number[] = [];
  const wdurations: number[] = [];
  const chars: string[] = [];
  const ctimes: number[] = [];
  const cdurations: number[] = [];

  if (!alignment || typeof alignment !== "object") {
    return buildEmptyTiming();
  }

  const a = alignment as ElevenLabsAlignment;
  const { characters, character_start_times_seconds, character_end_times_seconds } = a;

  if (
    !characters?.length ||
    !character_start_times_seconds?.length ||
    !character_end_times_seconds?.length ||
    characters.length !== character_start_times_seconds.length ||
    characters.length !== character_end_times_seconds.length
  ) {
    return buildEmptyTiming();
  }

  let currentWord = "";
  let wordStartSec = -1;

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    const startSec = character_start_times_seconds[i];
    const endSec = character_end_times_seconds[i];

    chars.push(char);
    ctimes.push(Math.round(startSec * 1000));
    cdurations.push(Math.round((endSec - startSec) * 1000));

    if (char.match(/[^a-zA-Z0-9']/)) {
      if (currentWord.length > 0) {
        words.push(currentWord);
        wtimes.push(Math.round(wordStartSec * 1000));
        wdurations.push(
          Math.round((character_end_times_seconds[i - 1] - wordStartSec) * 1000)
        );
        currentWord = "";
        wordStartSec = -1;
      }
    } else {
      if (wordStartSec === -1) {
        wordStartSec = startSec;
      }
      currentWord += char;
    }
  }

  if (currentWord.length > 0) {
    words.push(currentWord);
    wtimes.push(Math.round(wordStartSec * 1000));
    const lastEnd = character_end_times_seconds[character_end_times_seconds.length - 1];
    wdurations.push(Math.round((lastEnd - wordStartSec) * 1000));
  }

  return { words, wtimes, wdurations, chars, ctimes, cdurations };
}
