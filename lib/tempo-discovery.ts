/**
 * tempo-discovery.ts
 * Types, copy, and helpers for Tempo Stage 2 Discovery (default class only).
 */

export type DiscoveryPhase = "prep" | "lobby" | "connecting" | "active" | "summary";

export type TranscriptRole = "dana" | "student";

export type DiscoveryTranscriptEntry = {
  role: TranscriptRole;
  content: string;
  timestamp: string;
};

/** Pre-call Open / Probe / Confirm planning form (required before lobby). */
export type DiscoveryPreCallPrep = {
  openQuestions: [string, string, string];
  anticipatedProbe: string;
  anticipatedConfirm: string;
};

export const EMPTY_DISCOVERY_PRE_CALL_PREP: DiscoveryPreCallPrep = {
  openQuestions: ["", "", ""],
  anticipatedProbe: "",
  anticipatedConfirm: "",
};

export type DiscoverySummaryForm = {
  businessIssue: string;
  keyProblems: string;
  quantifiedValue: string;
  personalValue: string;
  nextStep: string;
};

export const DEFAULT_DISCOVERY_SUMMARY: DiscoverySummaryForm = {
  businessIssue: "",
  keyProblems: "",
  quantifiedValue: "",
  personalValue: "",
  nextStep: "",
};

export const DISCOVERY_SUMMARY_FIELDS = [
  {
    id: "businessIssue" as const,
    label: "Business Issue",
    helper: "What is the high-level business problem Dana mentioned?",
    placeholder:
      "e.g., Summit Dental is losing approximately X% of appointments to no-shows each month...",
    rows: 4,
  },
  {
    id: "keyProblems" as const,
    label: "Key Problems",
    helper: "What specific operational or technical hurdles are in their way?",
    placeholder: "List the problems identified during discovery...",
    rows: 4,
  },
  {
    id: "quantifiedValue" as const,
    label: "Quantified Value",
    helper:
      "What are the hard metrics — no-show rates, hours lost, appointment volume?",
    placeholder: "e.g., Dana estimated their no-show rate at around 1 in 6 appointments...",
    rows: 4,
  },
  {
    id: "personalValue" as const,
    label: "Personal Value",
    helper:
      "What does success mean for Dana personally — her reputation, her staff, her relationship with Dr. Kim?",
    placeholder: "Individual motivations and personal drivers...",
    rows: 3,
  },
  {
    id: "nextStep" as const,
    label: "Next Step",
    helper: "What is the definitive next action committed to in the call?",
    placeholder: "e.g., Dana agreed to a presentation with her and Dr. Kim next week...",
    rows: 3,
  },
] as const;

export const DISCOVERY_TIPS = [
  "Ask open-ended questions — what, how, walk me through",
  "Let her finish before responding",
  "Don't mention pricing in this stage",
  "Get her to put numbers on the pain",
] as const;

export const TEMPO_VALUE_DRIVERS = [
  "Cut no-shows — automated reminders",
  "Free the front desk — self-booking",
  "After-hours demand — 24/7 booking",
  "Drive repeat visits — smart rebooking",
] as const;

const PREP_STORAGE_PREFIX = "tempo-discovery-prep-";

type StoredDiscoveryPrep = {
  form: DiscoveryPreCallPrep;
  confirmed: boolean;
};

/**
 * True when prep has enough content to enable Begin Discovery Call.
 * Requires ≥1 open question, plus non-empty probe and confirm fields.
 */
export function canBeginDiscoveryCall(form: DiscoveryPreCallPrep): boolean {
  const hasOpen = form.openQuestions.some((q) => q.trim().length > 0);
  return (
    hasOpen &&
    form.anticipatedProbe.trim().length > 0 &&
    form.anticipatedConfirm.trim().length > 0
  );
}

/**
 * Normalizes unknown saved prep into the DiscoveryPreCallPrep shape.
 */
export function normalizeDiscoveryPreCallPrep(raw: unknown): DiscoveryPreCallPrep {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_DISCOVERY_PRE_CALL_PREP, openQuestions: ["", "", ""] };
  }
  const obj = raw as Record<string, unknown>;
  const questionsRaw = Array.isArray(obj.openQuestions) ? obj.openQuestions : [];
  const openQuestions: [string, string, string] = [
    typeof questionsRaw[0] === "string" ? questionsRaw[0] : "",
    typeof questionsRaw[1] === "string" ? questionsRaw[1] : "",
    typeof questionsRaw[2] === "string" ? questionsRaw[2] : "",
  ];
  return {
    openQuestions,
    anticipatedProbe: typeof obj.anticipatedProbe === "string" ? obj.anticipatedProbe : "",
    anticipatedConfirm: typeof obj.anticipatedConfirm === "string" ? obj.anticipatedConfirm : "",
  };
}

/**
 * Saves prep draft (+ whether the student confirmed / left the prep step) to localStorage.
 */
export function saveDiscoveryPrepToStorage(
  attemptId: string,
  form: DiscoveryPreCallPrep,
  confirmed: boolean
): void {
  try {
    const payload: StoredDiscoveryPrep = { form, confirmed };
    localStorage.setItem(`${PREP_STORAGE_PREFIX}${attemptId}`, JSON.stringify(payload));
  } catch {
    /* ignore quota errors */
  }
}

/**
 * Loads prep draft from localStorage, or null when missing/invalid.
 */
export function loadDiscoveryPrepFromStorage(attemptId: string): StoredDiscoveryPrep | null {
  try {
    const raw = localStorage.getItem(`${PREP_STORAGE_PREFIX}${attemptId}`);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<StoredDiscoveryPrep>;
    return {
      form: normalizeDiscoveryPreCallPrep(parsed.form),
      confirmed: parsed.confirmed === true,
    };
  } catch {
    return null;
  }
}

/**
 * Extracts preCallPrep from a Discovery stage_scores transcript JSON blob.
 */
export function parseDiscoveryPreCallPrepFromTranscript(
  transcript: string | null | undefined
): DiscoveryPreCallPrep | null {
  if (!transcript?.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(transcript) as { preCallPrep?: unknown };
    if (!parsed.preCallPrep) {
      return null;
    }
    return normalizeDiscoveryPreCallPrep(parsed.preCallPrep);
  } catch {
    return null;
  }
}

/**
 * Formats elapsed seconds as MM:SS.
 */
export function formatDiscoveryTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Counts words in a summary field for the progress label.
 */
export function countSummaryWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\s+/).length;
}

/**
 * Returns whether all post-call summary fields meet the minimum length.
 */
export function canSubmitDiscoverySummary(form: DiscoverySummaryForm): boolean {
  const minLen = 6;
  return (
    form.businessIssue.trim().length >= minLen &&
    form.keyProblems.trim().length >= minLen &&
    form.quantifiedValue.trim().length >= minLen &&
    form.personalValue.trim().length >= minLen &&
    form.nextStep.trim().length >= minLen
  );
}

/**
 * Parses voice session transcript lines into structured entries.
 */
export function parseDiscoveryTranscript(
  raw: string,
  callSeconds: number
): DiscoveryTranscriptEntry[] {
  const lines = raw.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return [];
  }

  return lines.map((line, index) => {
    const isStudent = line.startsWith("Student:");
    const content = line.replace(/^(Student|Persona):\s*/, "").trim();
    const approxSeconds = Math.min(
      callSeconds,
      Math.floor(((index + 1) / lines.length) * Math.max(callSeconds, 1))
    );
    return {
      role: isStudent ? "student" : "dana",
      content,
      timestamp: formatDiscoveryTime(approxSeconds),
    };
  });
}
