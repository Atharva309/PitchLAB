/**
 * constants.ts
 * Named constants for PitchLab — audio, STT, stages, scoring, and Simli tuning.
 */

import type { SimulationStage } from "@/types";

// ── Audio / Simli PCM ─────────────────────────────────────────────────────────

export const PCM_CHUNK_SIZE = 8192;
export const SAMPLE_RATE_HZ = 16000;
export const FLOAT_SAMPLES_PER_WORKER_CHUNK = PCM_CHUNK_SIZE / 2;

// ── Deepgram ──────────────────────────────────────────────────────────────────

export const UTTERANCE_DEDUPE_MS = 900;
export const ENDPOINTING_MS = 350;
export const UTTERANCE_END_MS = 1000;

/** Longer silence before phrase end — voice conversation stages (student must finish). */
export const VOICE_ENDPOINTING_MS = 900;

/** Longer utterance end — reduces persona cutting off the student mid-thought. */
export const VOICE_UTTERANCE_END_MS = 1800;

/** Cooldown after persona TTS before accepting the next student utterance. */
export const POST_SPEAK_COOLDOWN_MS = 400;
export const DEEPGRAM_MODEL = "nova-2";
export const DEEPGRAM_LANGUAGE = "en-US";
export const MEDIA_RECORDER_TIMESLICE_MS = 250;

// ── LLM ───────────────────────────────────────────────────────────────────────

export const MAX_TOKENS = 120;
export const MAX_SCORE_TOKENS = 500;
export const DEBOUNCE_MS = 1200;

// ── Simli ─────────────────────────────────────────────────────────────────────

/** Max wait for Simli WebRTC + ack before showing a connection error. */
export const SIMLI_CONNECT_TIMEOUT_MS = 15_000;

export const POST_CONNECT_ACK_WAIT_MS = 300;
export const SIMLI_MAX_SESSION_LENGTH_SEC = 3600;
export const SIMLI_MAX_IDLE_TIME_SEC = 300;

/** Brief pause after end call before revealing the stage score UI. */
export const CALL_SCORE_DELAY_MS = 1500;

/** Student picture-in-picture dimensions during video calls. */
export const PIP_WIDTH_PX = 200;
export const PIP_HEIGHT_PX = 150;

// ── ElevenLabs ────────────────────────────────────────────────────────────────

export const ELEVENLABS_MODEL_ID = "eleven_turbo_v2_5";
export const ELEVENLABS_STABILITY = 0.5;
export const ELEVENLABS_SIMILARITY_BOOST = 0.75;

// ── PitchLab stages ───────────────────────────────────────────────────────────

export const STAGE_LABELS: Record<SimulationStage, string> = {
  lead_gen: "Lead Gen",
  prospecting: "Prospecting",
  discovery: "Discovery",
  presentation: "Presentation",
  objections: "Objections",
  close: "Close",
  results: "Results",
};

export const SCORED_STAGES: SimulationStage[] = [
  "lead_gen",
  "prospecting",
  "discovery",
  "presentation",
  "objections",
  "close",
];

export const MAX_STAGE_SCORE = 100;
export const TOTAL_STAGES_COUNT = 6;
export const MAX_TOTAL_SCORE = MAX_STAGE_SCORE * TOTAL_STAGES_COUNT;

export const GRADE_A_MIN = 540;
export const GRADE_B_MIN = 420;
export const GRADE_C_MIN = 300;
export const GRADE_D_MIN = 180;

export const PRESENTATION_MIN_WORDS = 100;

export const OBJECTIONS_COUNT = 3;

// ── Routes ──────────────────────────────────────────────────────────────────────

export const PUBLIC_ROUTES = ["/login", "/register"] as const;

export const DEFAULT_OPENING_GREETING =
  "Yeah? I've got customers—what do you need?";

/** Appended to persona system prompts on voice stages — reduces interruptions. */
export const PERSONA_LISTENING_RULES =
  "CRITICAL RULE: Let the student finish speaking completely before you respond. Never interrupt mid-sentence. Wait for a clear pause. Keep replies to 2-3 short sentences.";
