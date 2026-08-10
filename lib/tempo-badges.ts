/**
 * tempo-badges.ts
 * Badge definitions and GPT-based detection for Tempo stages.
 * Wired from POST /api/student/complete-stage; results stored in stage_scores.badges_earned.
 */

import OpenAI from "openai";

/** Optional Discovery pre-call OPC plan passed into badge detection for disc_opc context. */
export type DiscoveryPreCallPrepPayload = {
  openQuestions: string[];
  anticipatedProbe: string;
  anticipatedConfirm: string;
};

// ── Badge definitions (professor spec — IDs/names are final) ───

export const DISCOVERY_BADGES = [
  {
    id: "disc_business_issue",
    name: "Found the Business Issue",
    description: "Got to a measurable issue, not just a complaint",
  },
  {
    id: "disc_value_buyer",
    name: "Value from the Buyer",
    description: "Quantified value came from Dana, not the rep",
  },
  {
    id: "disc_personal_value",
    name: "Heard What She Didn't Say",
    description: "Surfaced Personal Value",
  },
  {
    id: "disc_opc",
    name: "Ran the OPC Play",
    description: "Visible Open-Probe-Confirm cadence",
  },
  {
    id: "disc_earned_right",
    name: "Earned the Right",
    description: "Opened with credibility, not a pitch",
  },
  {
    id: "disc_held_line",
    name: "Held the Discovery Line",
    description: "Didn't pitch early",
  },
] as const;

export const OBJECTION_BADGES = [
  {
    id: "obj_business_issue",
    name: "Back to the Business Issue",
    description: "Reconnected objections to the measurable issue",
  },
  {
    id: "obj_cost_value",
    name: "Cost into Value",
    description: "Re-anchored price on ROI",
  },
  {
    id: "obj_differentiated",
    name: "Made it Differentiated",
    description: "Defended on uniqueness, not discount",
  },
  {
    id: "obj_real_concern",
    name: "Found the Real Concern",
    description: "OPC to the root concern",
  },
  {
    id: "obj_acknowledged",
    name: "Acknowledged First",
    description: "Validated before responding",
  },
  {
    id: "obj_held_line",
    name: "Held the Line",
    description: "Didn't cave under pressure",
  },
] as const;

export const PROSPECTING_BADGES = [
  {
    id: "pros_guardrails",
    name: "Built Guardrails",
    description: "Built guardrails against AI fabrication",
  },
  {
    id: "pros_reusable_system",
    name: "Reusable System",
    description: "Designed a reusable system, not a one-off",
  },
  {
    id: "pros_directed_agent",
    name: "Directed the Agent",
    description: "Critiqued the AI's output rather than accepting it blindly",
  },
  {
    id: "pros_real_trigger",
    name: "Found a Real Trigger",
    description: "Found a credible, specific trigger event",
  },
  {
    id: "pros_business_issue_led",
    name: "Led with the Business Issue",
    description: "Led with a business issue, not features",
  },
] as const;

export const PRESENTATION_BADGES = [
  {
    id: "pres_tailored",
    name: "Tailored to Their Issues",
    description: "Tied the business case and pain points to Summit-specific findings",
  },
  {
    id: "pres_value_led",
    name: "Led with Value",
    description: "Framed how Tempo solves the problem as outcomes, not a feature dump",
  },
  {
    id: "pres_roi_quantified",
    name: "Quantified the ROI",
    description: "Quantified the payoff with real math or dollar impact",
  },
  {
    id: "pres_proof_point",
    name: "Used a Proof Point",
    description: "Used a relevant supporting proof point",
  },
  {
    id: "pres_power_stakeholder",
    name: "Spoke to Decision Power",
    description: "Addressed who needs to say yes — Dana and Dr. Kim",
  },
  {
    id: "pres_next_step",
    name: "Clear Next Step",
    description: "Made a clear next-step ask",
  },
] as const;

export const NEGOTIATION_BADGES = [
  {
    id: "neg_defended_value",
    name: "Defended Value Before Price",
    description: "Defended value before discussing price",
  },
  {
    id: "neg_traded",
    name: "Traded, Didn't Concede",
    description: "Traded rather than caved on concessions",
  },
  {
    id: "neg_true_priority",
    name: "Found Their True Priority",
    description: "Identified Kim's real priority beyond price",
  },
  {
    id: "neg_protected_value",
    name: "Protected the Value",
    description: "Protected deal value/margin",
  },
  {
    id: "neg_closed_deal",
    name: "Closed the Deal",
    description: "Reached an agreed or partial close",
  },
] as const;

export type DiscoveryBadgeId = (typeof DISCOVERY_BADGES)[number]["id"];
export type ObjectionBadgeId = (typeof OBJECTION_BADGES)[number]["id"];
export type ProspectingBadgeId = (typeof PROSPECTING_BADGES)[number]["id"];
export type PresentationBadgeId = (typeof PRESENTATION_BADGES)[number]["id"];
export type NegotiationBadgeId = (typeof NEGOTIATION_BADGES)[number]["id"];

/** Material Symbols Outlined icon names keyed by Tempo badge id. */
export const TEMPO_BADGE_ICONS: Record<string, string> = {
  pros_guardrails: "fact_check",
  pros_reusable_system: "autorenew",
  pros_directed_agent: "smart_toy",
  pros_real_trigger: "bolt",
  pros_business_issue_led: "target",

  disc_business_issue: "target",
  disc_value_buyer: "payments",
  disc_personal_value: "favorite",
  disc_opc: "sync_alt",
  disc_earned_right: "verified_user",
  disc_held_line: "shield",

  pres_tailored: "tune",
  pres_value_led: "trending_up",
  pres_roi_quantified: "calculate",
  pres_proof_point: "verified",
  pres_power_stakeholder: "group",
  pres_next_step: "arrow_forward",

  obj_business_issue: "target",
  obj_cost_value: "payments",
  obj_differentiated: "star",
  obj_real_concern: "search_check",
  obj_acknowledged: "thumb_up",
  obj_held_line: "shield",

  neg_defended_value: "shield",
  neg_traded: "swap_horiz",
  neg_true_priority: "psychology",
  neg_protected_value: "savings",
  neg_closed_deal: "handshake",
};

export type TempoBadgeStage =
  | "discovery"
  | "objections"
  | "prospecting"
  | "presentation"
  | "close";

/** Negotiation badges judged by GPT (neg_closed_deal is deterministic). */
const NEGOTIATION_GPT_BADGE_IDS = [
  "neg_defended_value",
  "neg_traded",
  "neg_true_priority",
  "neg_protected_value",
] as const;

const MAX_BADGE_DETECTION_TOKENS = 400;

const DISCOVERY_BADGE_IDS: ReadonlySet<string> = new Set(
  DISCOVERY_BADGES.map((badge) => badge.id)
);

const OBJECTION_BADGE_IDS: ReadonlySet<string> = new Set(
  OBJECTION_BADGES.map((badge) => badge.id)
);

const PROSPECTING_BADGE_IDS: ReadonlySet<string> = new Set(
  PROSPECTING_BADGES.map((badge) => badge.id)
);

const PRESENTATION_BADGE_IDS: ReadonlySet<string> = new Set(
  PRESENTATION_BADGES.map((badge) => badge.id)
);

const NEGOTIATION_BADGE_IDS: ReadonlySet<string> = new Set(
  NEGOTIATION_BADGES.map((badge) => badge.id)
);

const NEGOTIATION_GPT_ALLOWED_IDS: ReadonlySet<string> = new Set(NEGOTIATION_GPT_BADGE_IDS);

// ── Prompt builders ───

/**
 * Builds the Discovery badge-detection system prompt with full earn criteria.
 * CRM-dependent badges judge crm log fields; behavior badges judge the call transcript.
 * disc_opc also receives optional pre-call OPC plan as context (not a substitute for live execution).
 */
function buildDiscoveryBadgePrompt(hasCrmFields: boolean): string {
  const crmCriteria = hasCrmFields
    ? `- disc_business_issue: CRM businessIssue (and supporting painPoints) shows a time-bound, measurable business issue — not just a vague complaint
- disc_value_buyer: CRM quantifiedValue / painPoints show quantified numbers that came from the buyer, not asserted by the rep
- disc_personal_value: CRM stakeholders / painPoints / businessIssue evidence surfaces Dana's personal stake (e.g. looking good to Dr. Kim, protecting staff)
`
    : "";

  return `You are a sales coach evaluating a Tempo Discovery submission. Material includes a live call transcript and, when present, CRM log fields and/or a PRE_CALL_PREP plan (openQuestions, anticipatedProbe, anticipatedConfirm).

Award a badge ONLY when the evidence clearly shows the criterion was met. Be strict — do not award on weak or ambiguous evidence. Prefer an empty list over false positives.

Badge criteria (award the ID only if earned):
${crmCriteria}- disc_opc: Judge OPC execution primarily from what actually happened in the LIVE CALL TRANSCRIPT. The student's pre-call plan (PRE_CALL_PREP), when present, is context only — award this badge based on genuine live listening and adapting (Open → Probe → Confirm responding to Dana's answers), not just because a plan existed. If the student's live questions closely mirror their pre-written plan regardless of what the buyer actually said, that is NOT sufficient for this badge — real probing/confirming must respond to Dana's actual answers. Do not award for a flat checklist of closed questions.
- disc_earned_right: in the CALL TRANSCRIPT, the rep opened with brief credibility/framing rather than diving straight into questions or a pitch
- disc_held_line: in the CALL TRANSCRIPT, the rep held off pitching Tempo features until the issue and value were understood

Return ONLY valid JSON in this exact shape, nothing else:
{"badgesEarned":["disc_opc"]}

Use only the badge IDs listed above. If none were earned, return {"badgesEarned":[]}.`;
}

/**
 * Builds the Objection Handling badge-detection system prompt with full earn criteria.
 */
function buildObjectionBadgePrompt(hasCrmFields: boolean): string {
  const crmCriteria = hasCrmFields
    ? `- obj_business_issue: CRM howResolved / objectionsRaised reconnect objections to Kim's measurable business issue rather than staying on surface complaints
- obj_cost_value: CRM howResolved / remainingConcerns show price pushback reframed via ROI/value, not argued on price alone
- obj_differentiated: CRM howResolved / objectionsRaised show Tempo specifically differentiated (vs SlotEasy/status quo), not just asserted quality
`
    : "";

  return `You are a sales coach evaluating a Tempo Objection Handling submission. Material includes a live call transcript and, when present, CRM log fields for this stage.

Award a badge ONLY when the evidence clearly shows the criterion was met. Be strict — do not award on weak or ambiguous evidence. Prefer an empty list over false positives.

Badge criteria (award the ID only if earned):
${crmCriteria}- obj_real_concern: in the CALL TRANSCRIPT, the rep used questions to find the ROOT concern behind a surface objection instead of rebutting immediately
- obj_acknowledged: in the CALL TRANSCRIPT, the rep validated/acknowledged each concern before responding to it
- obj_held_line: in the CALL TRANSCRIPT, the rep stayed composed and did not reflexively discount to make an objection go away

Return ONLY valid JSON in this exact shape, nothing else:
{"badgesEarned":["obj_acknowledged","obj_held_line"]}

Use only the badge IDs listed above. If none were earned, return {"badgesEarned":[]}.`;
}

/**
 * Builds the Prospecting badge-detection system prompt with full earn criteria.
 */
function buildProspectingBadgePrompt(hasCrmFields: boolean): string {
  const crmCriteria = hasCrmFields
    ? `- pros_real_trigger: CRM trigger field is specific and credible (a real timing reason), not generic filler
- pros_business_issue_led: CRM whyFit leads with a plausible business issue/pain for the account, not a feature pitch
`
    : "";

  return `You are a sales coach evaluating a Tempo Prospecting stage submission (JSON with chatMessages from an AI research agent, selfCheck, and draft openingMessage) plus optional CRM log fields.

Award a badge ONLY when the submission clearly shows the criterion was met. Be strict — do not award on weak or ambiguous evidence. Prefer an empty list over false positives.

Badge criteria (award the ID only if earned):
- pros_guardrails: chatMessages / selfCheck show the student verifying claims or flagging unverified AI output, not blind trust of whatever the AI produced
- pros_reusable_system: chatMessages show a generalized reusable research approach, not a one-off hardcoded lookup for this account only
- pros_directed_agent: chatMessages show the student pushing back, correcting, or refining the AI's output — not just accepting the first response
${crmCriteria}
Return ONLY valid JSON in this exact shape, nothing else:
{"badgesEarned":["pros_directed_agent"]}

Use only the badge IDs listed above. If none were earned, return {"badgesEarned":[]}.`;
}

/**
 * Builds the Presentation badge-detection system prompt with full earn criteria.
 */
function buildPresentationBadgePrompt(): string {
  return `You are a sales coach evaluating a Tempo Presentation stage submission (JSON with a pitch form: businessCase, underlyingPainPoints, solution, proofPoint, powerStakeholder, nextStep) for Summit Dental / Tempo.

Award a badge ONLY when the submission clearly shows the criterion was met. Be strict — do not award on weak or ambiguous evidence. Prefer an empty list over false positives.

Badge criteria (award the ID only if earned):
- pres_tailored: businessCase and/or underlyingPainPoints reference specific Summit Dental details (e.g. no-shows, front desk load, expansion) — not a generic templated pitch
- pres_value_led: the solution field frames outcomes/value Tempo delivers before or instead of a feature list
- pres_roi_quantified: businessCase (and related fields) include concrete ROI math or dollar/time impact — not just vague value claims
- pres_proof_point: proofPoint cites a specific, relevant stat or case study used correctly
- pres_power_stakeholder: powerStakeholder addresses both Dana's day-to-day perspective and Dr. Kim's approval/concerns — not only one stakeholder
- pres_next_step: nextStep is one clear, specific ask (e.g. pilot, meeting, commitment) — not vague "follow up soon"

Return ONLY valid JSON in this exact shape, nothing else:
{"badgesEarned":["pres_roi_quantified","pres_proof_point"]}

Use only the badge IDs listed above. If none were earned, return {"badgesEarned":[]}.`;
}

/**
 * Builds the Negotiation GPT-judged badge prompt (excludes deterministic neg_closed_deal).
 */
function buildNegotiationGptBadgePrompt(): string {
  return `You are a sales coach evaluating a Tempo Negotiation (close) stage submission. The JSON includes scenarioA and scenarioB turn transcripts with Kim (buyer), plus optional aiWork.

Award a badge ONLY when the material clearly shows the criterion was met. Be strict — do not award on weak or ambiguous evidence. Prefer an empty list over false positives.

Do NOT judge whether a deal closed — that is handled separately. Only evaluate these four badges:

Badge criteria (award the ID only if earned):
- neg_defended_value: in Scenario A, the student resisted immediate discounting and reframed on ROI/value before any concession
- neg_traded: in Scenario B, the student proposed trades (gave something specific to get something specific) rather than pure concessions
- neg_true_priority: the student identified and addressed Kim's underlying priority (certainty the solution will work) rather than only negotiating surface price/terms
- neg_protected_value: the final agreed terms preserve real deal value/margin rather than reflexive full discounting

Return ONLY valid JSON in this exact shape, nothing else:
{"badgesEarned":["neg_defended_value","neg_traded"]}

Use only the four badge IDs listed above. If none were earned, return {"badgesEarned":[]}.`;
}

const CRM_DEPENDENT_BADGE_IDS: Record<
  "prospecting" | "discovery" | "objections",
  readonly string[]
> = {
  prospecting: ["pros_real_trigger", "pros_business_issue_led"],
  discovery: ["disc_business_issue", "disc_value_buyer", "disc_personal_value"],
  objections: ["obj_business_issue", "obj_cost_value", "obj_differentiated"],
};

/**
 * Returns the allowed badge ID set for a Tempo badge stage.
 * When CRM fields are missing, CRM-dependent badges are excluded (not earned).
 */
function allowedBadgeIdsForStage(
  stage: TempoBadgeStage,
  crmFields: Record<string, string> | null
): ReadonlySet<string> {
  const base = (() => {
    switch (stage) {
      case "discovery":
        return DISCOVERY_BADGE_IDS;
      case "objections":
        return OBJECTION_BADGE_IDS;
      case "prospecting":
        return PROSPECTING_BADGE_IDS;
      case "presentation":
        return PRESENTATION_BADGE_IDS;
      case "close":
        return NEGOTIATION_BADGE_IDS;
    }
  })();

  if (crmFields !== null || (stage !== "prospecting" && stage !== "discovery" && stage !== "objections")) {
    return base;
  }

  const excluded = new Set(CRM_DEPENDENT_BADGE_IDS[stage]);
  return new Set(Array.from(base).filter((id) => !excluded.has(id)));
}

/**
 * Returns the GPT system prompt for stages judged entirely by the model.
 */
function systemPromptForStage(
  stage: Exclude<TempoBadgeStage, "close">,
  hasCrmFields: boolean
): string {
  switch (stage) {
    case "discovery":
      return buildDiscoveryBadgePrompt(hasCrmFields);
    case "objections":
      return buildObjectionBadgePrompt(hasCrmFields);
    case "prospecting":
      return buildProspectingBadgePrompt(hasCrmFields);
    case "presentation":
      return buildPresentationBadgePrompt();
  }
}

/**
 * Builds the evaluation material string: transcript plus optional CRM fields
 * and optional Discovery pre-call prep (for disc_opc context).
 */
function buildBadgeMaterial(
  transcript: string,
  crmFields: Record<string, string> | null,
  discoveryPrep: DiscoveryPreCallPrepPayload | null = null
): string {
  let material = transcript;
  if (crmFields) {
    material = `${material}\n\nCRM_LOG_FIELDS:\n${JSON.stringify(crmFields)}`;
  }
  if (discoveryPrep) {
    material = `${material}\n\nPRE_CALL_PREP:\n${JSON.stringify(discoveryPrep)}`;
  }
  return material;
}

// ── Parse / validate ───

/**
 * Parses GPT JSON for badgesEarned. Returns null if shape is invalid.
 */
function parseBadgesResponse(raw: string): string[] | null {
  try {
    const parsed = JSON.parse(raw) as { badgesEarned?: unknown };
    if (!Array.isArray(parsed.badgesEarned)) {
      return null;
    }
    const ids: string[] = [];
    for (const item of parsed.badgesEarned) {
      if (typeof item === "string" && item.trim().length > 0) {
        ids.push(item.trim());
      }
    }
    return ids;
  } catch {
    return null;
  }
}

/**
 * Keeps only IDs present in allowed; drops duplicates and unknowns.
 */
function filterBadgeIds(allowed: ReadonlySet<string>, ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (!allowed.has(id) || seen.has(id)) {
      continue;
    }
    seen.add(id);
    result.push(id);
  }
  return result;
}

/**
 * Keeps only known badge IDs for the stage; drops duplicates and unknowns.
 */
function filterKnownBadgeIds(
  stage: TempoBadgeStage,
  ids: string[],
  crmFields: Record<string, string> | null = null
): string[] {
  return filterBadgeIds(allowedBadgeIdsForStage(stage, crmFields), ids);
}

/**
 * True when Scenario B outcome is deal_agreed or partial_close
 * (same condition as tempoResultsDealWon success path; false on parse failure).
 */
function isNegotiationDealClosed(transcript: string): boolean {
  try {
    const data = JSON.parse(transcript) as {
      scenarioB?: { outcome?: { status?: string } };
    };
    const status = data.scenarioB?.outcome?.status;
    return status === "deal_agreed" || status === "partial_close";
  } catch {
    return false;
  }
}

// ── OpenAI call ───

/**
 * Creates OpenAI client at call time (build-safe without env at compile).
 */
function createOpenAiClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}

/**
 * Requests one badge-detection completion from gpt-4o-mini.
 */
async function requestBadgeDetection(
  openai: OpenAI,
  systemPrompt: string,
  material: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: MAX_BADGE_DETECTION_TOKENS,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Evaluate the following material:\n\n${material}`,
      },
    ],
  });
  return response.choices[0]?.message?.content ?? "{}";
}

/**
 * Runs GPT badge detection with retry-once parse and ID filtering.
 * Returns [] on any failure.
 */
async function runGptBadgeDetection(
  systemPrompt: string,
  material: string,
  allowedIds: ReadonlySet<string>
): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[tempo-badges] OPENAI_API_KEY not configured.");
    return [];
  }

  try {
    const openai = createOpenAiClient(apiKey);

    let raw = await requestBadgeDetection(openai, systemPrompt, material);
    let parsed = parseBadgesResponse(raw);

    if (!parsed) {
      raw = await requestBadgeDetection(openai, systemPrompt, material);
      parsed = parseBadgesResponse(raw);
    }

    if (!parsed) {
      console.error("[tempo-badges] Failed to parse badge response after retry.");
      return [];
    }

    return filterBadgeIds(allowedIds, parsed);
  } catch (error) {
    console.error("[tempo-badges] Detection failed:", error);
    return [];
  }
}

/**
 * Negotiation: GPT-judges four behavioral badges; neg_closed_deal is deterministic.
 */
async function detectNegotiationBadges(transcript: string): Promise<string[]> {
  const gptBadges = await runGptBadgeDetection(
    buildNegotiationGptBadgePrompt(),
    transcript,
    NEGOTIATION_GPT_ALLOWED_IDS
  );

  const closed = isNegotiationDealClosed(transcript);
  if (!closed) {
    return filterKnownBadgeIds("close", gptBadges);
  }

  return filterKnownBadgeIds("close", [...gptBadges, "neg_closed_deal"]);
}

/**
 * Detects which Tempo badges were earned from a stage transcript/submission.
 * Returns validated badge IDs, or [] on any failure (API error, bad JSON, empty material).
 *
 * @param stage - discovery | objections | prospecting | presentation | close
 * @param transcript - stage transcript or JSON submission payload
 * @param crmFields - matching crm_log_entries.fields for CRM-dependent criteria, or null
 * @param discoveryPrep - optional Discovery pre-call OPC plan (disc_opc context only)
 */
export async function detectTempoBadges(
  stage: TempoBadgeStage,
  transcript: string,
  crmFields: Record<string, string> | null = null,
  discoveryPrep: DiscoveryPreCallPrepPayload | null = null
): Promise<string[]> {
  const trimmed = transcript.trim();
  if (trimmed.length === 0) {
    return [];
  }

  if (stage === "close") {
    return detectNegotiationBadges(trimmed);
  }

  const hasCrmFields = crmFields !== null;
  const prepForMaterial = stage === "discovery" ? discoveryPrep : null;
  const material = buildBadgeMaterial(trimmed, crmFields, prepForMaterial);

  return runGptBadgeDetection(
    systemPromptForStage(stage, hasCrmFields),
    material,
    allowedBadgeIdsForStage(stage, crmFields)
  );
}
