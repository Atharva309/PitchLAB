/**
 * persona-voice.ts
 * Builds system prompts for voice stages with listening rules appended.
 */

import { PERSONA_LISTENING_RULES } from "@/lib/constants";

/**
 * Appends anti-interruption rules to a simulation persona prompt for voice stages.
 * @param basePrompt - Teacher-defined persona_system_prompt
 * @param stageHint - Optional stage-specific instructions
 */
export function buildVoiceSystemPrompt(basePrompt: string, stageHint?: string): string {
  const parts = [basePrompt.trim(), PERSONA_LISTENING_RULES];
  if (stageHint?.trim()) {
    parts.push(stageHint.trim());
  }
  return parts.join("\n\n");
}
