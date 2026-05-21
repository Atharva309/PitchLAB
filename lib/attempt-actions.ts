/**
 * attempt-actions.ts
 * Client-side Supabase helpers for attempts and stage scores.
 */

import { createClient } from "@/lib/supabase/client";
import { getNextStage } from "@/lib/stages";
import type { SimulationStage } from "@/types";

/**
 * Saves a stage score and advances the attempt to the next stage.
 */
export async function completeStage(
  attemptId: string,
  stage: SimulationStage,
  score: number,
  feedback: string,
  transcript: string
): Promise<{ nextStage: SimulationStage | null; totalScore: number }> {
  const supabase = createClient();

  await supabase.from("stage_scores").upsert(
    {
      attempt_id: attemptId,
      stage,
      score,
      feedback,
      transcript,
    },
    { onConflict: "attempt_id,stage" }
  );

  const { data: scores } = await supabase
    .from("stage_scores")
    .select("score")
    .eq("attempt_id", attemptId);

  const totalScore = (scores ?? []).reduce((sum, row) => sum + row.score, 0);
  const next = getNextStage(stage);

  if (next === "results" || next === null) {
    await supabase
      .from("attempts")
      .update({
        current_stage: "results",
        status: "completed",
        total_score: totalScore,
        completed_at: new Date().toISOString(),
      })
      .eq("id", attemptId);
    return { nextStage: "results", totalScore };
  }

  await supabase
    .from("attempts")
    .update({ current_stage: next, total_score: totalScore })
    .eq("id", attemptId);

  return { nextStage: next, totalScore };
}

/**
 * Fetches score for a stage via /api/score.
 */
export async function fetchStageScore(payload: {
  stage: SimulationStage;
  transcript?: string;
  pitchText?: string;
  studentAnswers?: { fit: string; painPoints: string; openingApproach: string };
  simulationContext: {
    personaName: string;
    personaRole: string;
    personaSystemPrompt: string;
    productContext: string;
  };
  runningTotalScore?: number;
}): Promise<{ score: number; feedback: string }> {
  const res = await fetch("/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Scoring failed");
  }
  return res.json() as Promise<{ score: number; feedback: string }>;
}
