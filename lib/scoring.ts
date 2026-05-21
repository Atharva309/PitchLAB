/**
 * scoring.ts
 * GPT-4o sales coach prompts and rubrics per simulation stage.
 */

import type { LeadGenAnswers, SimulationContext, SimulationStage } from "@/types";

/**
 * Builds the system prompt for the scoring API based on stage rubric.
 */
export function buildScoringSystemPrompt(stage: SimulationStage): string {
  const base = `You are an expert B2B sales coach scoring a student's performance in a role-play simulation.
Return ONLY valid JSON: {"score": <integer 0-100>, "feedback": "<2-4 sentences of specific, actionable feedback>"}.
Be fair but rigorous.`;

  const rubrics: Record<SimulationStage, string> = {
    lead_gen: `${base}
Rubric — Lead Gen: qualification accuracy, pain point identification, opening approach quality.`,
    prospecting: `${base}
Rubric — Prospecting: rapport building, clear value proposition, handling brush-offs, professional tone.`,
    discovery: `${base}
Rubric — Discovery: quality of questions, active listening, uncovering pain, avoiding premature pitching.`,
    presentation: `${base}
Rubric — Presentation: clarity, relevance to discovered pain, structure, compelling narrative.`,
    objections: `${base}
Rubric — Objections: empathy, reframe skill, evidence/examples, confidence without aggression.`,
    close: `${base}
Rubric — Close: confidence, timing, handling hesitation, clear next steps, appropriate ask.`,
    results: `${base}
Rubric — General sales performance.`,
  };

  return rubrics[stage] ?? rubrics.discovery;
}

/**
 * Builds the user message payload for GPT scoring.
 */
export function buildScoringUserMessage(
  stage: SimulationStage,
  context: SimulationContext,
  options: {
    transcript?: string;
    pitchText?: string;
    studentAnswers?: LeadGenAnswers;
    runningTotalScore?: number;
  }
): string {
  const { personaName, personaRole, productContext } = context;
  const header = `Persona: ${personaName} (${personaRole}). Product being sold: ${productContext}.`;

  if (stage === "lead_gen" && options.studentAnswers) {
    const { fit, painPoints, openingApproach } = options.studentAnswers;
    return `${header}
Stage: Lead Gen
Student answers:
1. Fit: ${fit}
2. Pain points: ${painPoints}
3. Opening approach: ${openingApproach}`;
  }

  if (stage === "presentation" && options.pitchText) {
    return `${header}
Stage: Presentation
Student pitch:
${options.pitchText}`;
  }

  const running = options.runningTotalScore ?? 0;
  return `${header}
Stage: ${stage}
Running score so far (out of 500 max before this stage): ${running}
Conversation transcript:
${options.transcript ?? "(no transcript)"}`;
}
