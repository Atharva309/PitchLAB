import { NextResponse } from "next/server";
import OpenAI from "openai";
import { CHAT_SYSTEM_PROMPT } from "@/lib/persona";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, newMessage } = await req.json();

    const conversationHistory = [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      ...(messages || []),
      { role: "user", content: newMessage },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 120,
      messages: conversationHistory,
    });

    const reply = response.choices[0]?.message?.content || "I don't have time for this.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
