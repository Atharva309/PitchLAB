import { NextResponse } from "next/server";
import { timingsFromAlignment } from "@/lib/elevenLabsTimings";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const voiceId = process.env.ELEVENLABS_VOICE_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!voiceId || !apiKey) {
      return NextResponse.json(
        { error: "Missing ELEVENLABS_VOICE_ID or ELEVENLABS_API_KEY" },
        { status: 500 }
      );
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
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    const audioBase64 = data.audio_base64 as string | undefined;
    const alignment = data.alignment;

    const { words, wtimes, wdurations, chars, ctimes, cdurations } =
      timingsFromAlignment(alignment);

    return NextResponse.json({
      audioBase64,
      words,
      wtimes,
      wdurations,
      chars,
      ctimes,
      cdurations,
    });
  } catch (error) {
    console.error("Error generating TTS:", error);
    return NextResponse.json({ error: "Failed to generate TTS" }, { status: 500 });
  }
}
