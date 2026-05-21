/**
 * types/index.ts
 * Shared TypeScript types for PitchLab — auth, simulations, stages, voice, and API payloads.
 */

export type UserRole = "student" | "teacher";

export type AttemptStatus = "in_progress" | "completed";

export type SimulationStage =
  | "lead_gen"
  | "prospecting"
  | "discovery"
  | "presentation"
  | "objections"
  | "close"
  | "results";

export const STAGE_ORDER: SimulationStage[] = [
  "lead_gen",
  "prospecting",
  "discovery",
  "presentation",
  "objections",
  "close",
  "results",
];

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
};

export type Simulation = {
  id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  persona_name: string;
  persona_role: string;
  persona_system_prompt: string;
  product_context: string;
  simli_face_id: string;
  is_published: boolean;
  created_at: string;
};

export type Attempt = {
  id: string;
  student_id: string;
  simulation_id: string;
  status: AttemptStatus;
  current_stage: SimulationStage;
  total_score: number;
  started_at: string;
  completed_at: string | null;
};

export type StageScore = {
  id: string;
  attempt_id: string;
  stage: SimulationStage;
  score: number;
  feedback: string | null;
  transcript: string | null;
  completed_at: string;
};

export type LeaderboardEntry = {
  rank: number;
  student_id: string;
  student_name: string;
  total_score: number;
  grade: string;
  attempt_id: string;
};

/** Imperative handle exposed by Avatar for TTS playback and interruption. */
export interface AvatarRef {
  speakAudio: (data: SpeakAudioPayload) => Promise<void>;
  resumeAudioContext: () => void;
  stopSpeaking: () => void;
  isReady: () => boolean;
  waitUntilReady: (maxMs?: number) => Promise<boolean>;
}

export type SpeakAudioPayload = {
  audio: ArrayBuffer | Blob;
  words?: string[];
  wtimes?: number[];
  wdurations?: number[];
  chars?: string[];
  ctimes?: number[];
  cdurations?: number[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type LipSyncTiming = {
  words: string[];
  wtimes: number[];
  wdurations: number[];
  chars: string[];
  ctimes: number[];
  cdurations: number[];
};

/** Flags on each Deepgram transcript WebSocket message. */
export type DeepgramTranscriptMeta = {
  isFinal: boolean;
  isSpeechFinal: boolean;
};

export interface DeepgramConnection {
  send: (data: Blob | ArrayBuffer) => void;
  close: () => void;
  onTranscript: (callback: (transcript: string, meta: DeepgramTranscriptMeta) => void) => void;
  onOpen: (callback: () => void) => void;
  onClose: (callback: () => void) => void;
  onError: (callback: (error: Event) => void) => void;
}

export type DeepgramStreamOptions = {
  model?: string;
  language?: string;
  smart_format?: boolean;
  interim_results?: boolean;
  utterance_end_ms?: number;
  vad_events?: boolean;
  endpointing?: number;
};

export type ElevenLabsAlignment = {
  characters?: string[];
  character_start_times_seconds?: number[];
  character_end_times_seconds?: number[];
};

export type ChatRequestBody = {
  messages?: ChatMessage[];
  newMessage: string;
  systemPrompt?: string;
};

export type TtsRequestBody = {
  text: string;
};

export type TtsResponseBody = {
  audioBase64?: string;
  words: string[];
  wtimes: number[];
  wdurations: number[];
  chars: string[];
  ctimes: number[];
  cdurations: number[];
};

export type ScoreRequestBody = {
  stage: SimulationStage;
  transcript?: string;
  pitchText?: string;
  studentAnswers?: LeadGenAnswers;
  simulationContext: SimulationContext;
  runningTotalScore?: number;
};

export type LeadGenAnswers = {
  fit: string;
  painPoints: string;
  openingApproach: string;
};

export type SimulationContext = {
  personaName: string;
  personaRole: string;
  personaSystemPrompt: string;
  productContext: string;
};

export type ScoreResponseBody = {
  score: number;
  feedback: string;
};

export type StageProgressItem = {
  stage: SimulationStage;
  label: string;
  status: "completed" | "current" | "locked";
  score?: number;
};
