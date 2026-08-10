/**
 * presentation-stage/route.ts
 * Loads and saves Tempo Stage 3 presentation draft on attempts.stage_data.presentation.
 * Student JWT session required; uses service role for DB access.
 */

import { NextResponse } from "next/server";
import { requireStudentApi } from "@/lib/api-auth";
import {
  EMPTY_PRESENTATION_FORM,
  normalizePresentationForm,
  type PresentationForm,
  type PresentationStageData,
} from "@/lib/tempo-presentation";
import { createServiceClient } from "@/lib/supabase/server";

type SaveBody = {
  attemptId?: string;
  form?: PresentationForm;
};

/**
 * GET /api/student/presentation-stage?attemptId=...
 * Returns saved presentation form or defaults.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireStudentApi();
  if (!auth.ok) {
    return auth.response;
  }

  const attemptId = new URL(request.url).searchParams.get("attemptId")?.trim() ?? "";
  if (!attemptId) {
    return NextResponse.json({ error: "Missing attemptId." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: attempt, error } = await supabase
    .from("attempts")
    .select("id, student_id, stage_data")
    .eq("id", attemptId)
    .eq("student_id", auth.session.studentId)
    .single();

  if (error || !attempt) {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }

  const stageData = (attempt.stage_data ?? {}) as PresentationStageData;
  const form: PresentationForm = stageData.presentation
    ? normalizePresentationForm(stageData.presentation as unknown as Record<string, unknown>)
    : EMPTY_PRESENTATION_FORM;

  return NextResponse.json({ form });
}

/**
 * POST /api/student/presentation-stage
 * Persists presentation draft under attempts.stage_data.presentation.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireStudentApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as SaveBody;
    const attemptId = body.attemptId?.trim() ?? "";
    const form = body.form;

    if (!attemptId || !form) {
      return NextResponse.json({ error: "Missing attemptId or form." }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: attempt } = await supabase
      .from("attempts")
      .select("id, student_id, stage_data")
      .eq("id", attemptId)
      .eq("student_id", auth.session.studentId)
      .single();

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    const existing = (attempt.stage_data ?? {}) as Record<string, unknown>;
    const { error: updateError } = await supabase
      .from("attempts")
      .update({ stage_data: { ...existing, presentation: form } })
      .eq("id", attemptId);

    if (updateError) {
      console.error("[presentation-stage] save", updateError);
      return NextResponse.json({ error: "Could not save draft." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[presentation-stage] unexpected", err);
    return NextResponse.json({ error: "Could not save draft." }, { status: 500 });
  }
}
