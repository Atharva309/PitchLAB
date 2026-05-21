/**
 * route.ts — /api/tts
 * ElevenLabs text-to-speech with character alignment timestamps.
 */

import { NextResponse } from "next/server";
import {
  ELEVENLABS_MODEL_ID,
  ELEVENLABS_SIMILARITY_BOOST,
  ELEVENLABS_STABILITY,
} from "@/lib/constants";
import { timingsFromAlignment } from "@/lib/elevenLabsTimings";
import type { TtsRequestBody, TtsResponseBody } from "@/types";

/**
 * POST /api/tts — synthesizes speech for avatar or phone UI.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const voiceId = process.env.ELEVENLABS_VOICE_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!voiceId || !apiKey) {
      return NextResponse.json(
        { error: "ELEVENLABS_VOICE_ID or ELEVENLABS_API_KEY missing." },
        { status: 500 }
      );
    }

    const body = (await req.json()) as TtsRequestBody;
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text is required." }, { status: 400 });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: ELEVENLABS_MODEL_ID,
          voice_settings: {
            stability: ELEVENLABS_STABILITY,
            similarity_boost: ELEVENLABS_SIMILARITY_BOOST,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error ${response.status}`);
    }

    const data = (await response.json()) as {
      audio_base64?: string;
      alignment?: unknown;
    };

    const { words, wtimes, wdurations, chars, ctimes, cdurations } = timingsFromAlignment(
      data.alignment
    );

    const payload: TtsResponseBody = {
      audioBase64: data.audio_base64,
      words,
      wtimes,
      wdurations,
      chars,
      ctimes,
      cdurations,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("TTS route error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate TTS";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
