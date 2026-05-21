/**
 * route.ts — /api/score
 * GPT-4o sales coach scoring for each simulation stage.
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { MAX_SCORE_TOKENS } from "@/lib/constants";
import { buildScoringSystemPrompt, buildScoringUserMessage } from "@/lib/scoring";
import type { ScoreRequestBody, ScoreResponseBody } from "@/types";

/**
 * Creates OpenAI client at request time (build-safe without env at compile).
 */
function createOpenAiClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}

/**
 * POST /api/score — returns numeric score and written feedback.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured." }, { status: 500 });
    }

    const body = (await req.json()) as ScoreRequestBody;
    const { stage, simulationContext } = body;

    if (!stage || !simulationContext) {
      return NextResponse.json({ error: "stage and simulationContext are required." }, { status: 400 });
    }

    const openai = createOpenAiClient(apiKey);
    const userMessage = buildScoringUserMessage(stage, simulationContext, {
      transcript: body.transcript,
      pitchText: body.pitchText,
      studentAnswers: body.studentAnswers,
      runningTotalScore: body.runningTotalScore,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: MAX_SCORE_TOKENS,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildScoringSystemPrompt(stage) },
        { role: "user", content: userMessage },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { score?: number; feedback?: string };
    const score = Math.min(100, Math.max(0, Math.round(parsed.score ?? 0)));
    const feedback = parsed.feedback ?? "No feedback generated.";

    const payload: ScoreResponseBody = { score, feedback };
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Score route error:", error);
    const message = error instanceof Error ? error.message : "Scoring failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
