/**
 * route.ts — /api/chat
 * GPT-4o persona replies with dynamic system prompt from simulation.
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { MAX_TOKENS } from "@/lib/constants";
import { CHAT_SYSTEM_PROMPT } from "@/lib/persona";
import type { ChatMessage, ChatRequestBody } from "@/types";

function createOpenAiClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}

/**
 * POST /api/chat — generates the persona's next spoken line.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured." }, { status: 500 });
    }

    const body = (await req.json()) as ChatRequestBody;
    const { messages, newMessage, systemPrompt } = body;

    if (!newMessage || typeof newMessage !== "string") {
      return NextResponse.json({ error: "newMessage is required." }, { status: 400 });
    }

    const prior: ChatMessage[] = Array.isArray(messages) ? messages : [];
    const system = systemPrompt?.trim() || CHAT_SYSTEM_PROMPT;

    const openai = createOpenAiClient(apiKey);
    const conversationHistory: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: system },
      ...prior.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: newMessage },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: MAX_TOKENS,
      messages: conversationHistory,
    });

    const reply =
      response.choices[0]?.message?.content?.trim() || "I don't have time for this.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat route error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
