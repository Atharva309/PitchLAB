/**
 * SimulationForm.tsx
 * Two-column create / edit simulation form for teachers (Stitch layout).
 */

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CHAT_SYSTEM_PROMPT } from "@/lib/persona";
import type { Simulation } from "@/types";

type SimulationFormProps = {
  teacherId: string;
  initial?: Simulation;
};

/**
 * Teacher form to save or publish a simulation.
 */
export function SimulationForm({
  teacherId,
  initial,
}: SimulationFormProps): React.ReactElement {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [personaName, setPersonaName] = useState(initial?.persona_name ?? "Dana Reeves");
  const [personaRole, setPersonaRole] = useState(
    initial?.persona_role ?? "Retail shop owner at Walmart"
  );
  const [personaPrompt, setPersonaPrompt] = useState(
    initial?.persona_system_prompt ?? CHAT_SYSTEM_PROMPT
  );
  const [simliFaceId, setSimliFaceId] = useState(
    initial?.simli_face_id ?? process.env.NEXT_PUBLIC_SIMLI_FACE_ID ?? ""
  );
  const [productContext, setProductContext] = useState(initial?.product_context ?? "");
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (publish: boolean): Promise<void> => {
    setIsLoading(true);
    setError("");

    if (!title || !personaName || !personaRole || !personaPrompt || !productContext || !simliFaceId) {
      setError("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    const payload = {
      teacher_id: teacherId,
      title,
      description: description || null,
      persona_name: personaName,
      persona_role: personaRole,
      persona_system_prompt: personaPrompt,
      product_context: productContext,
      simli_face_id: simliFaceId,
      is_published: publish || isPublished,
    };

    const supabase = createClient();
    const shouldPublish = publish || isPublished;

    if (initial) {
      const { error: updateError } = await supabase
        .from("simulations")
        .update(payload)
        .eq("id", initial.id);
      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }
      router.push(shouldPublish ? "/teacher/dashboard" : `/teacher/simulation/${initial.id}/edit`);
    } else {
      const { data, error: insertError } = await supabase
        .from("simulations")
        .insert(payload)
        .select("id")
        .single();
      if (insertError) {
        setError(insertError.message);
        setIsLoading(false);
        return;
      }
      router.push(shouldPublish ? "/teacher/dashboard" : `/teacher/simulation/${data.id}/edit`);
    }
    router.refresh();
    setIsLoading(false);
  };

  return (
    <form className="max-w-5xl" onSubmit={(e) => e.preventDefault()}>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section className="card-surface p-6 space-y-4">
            <h2 className="font-semibold text-text-primary text-lg border-b border-border pb-2">
              Basics
            </h2>
            <input
              placeholder="Simulation title"
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder="Description"
              className="input-field"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </section>

          <section className="card-surface p-6 space-y-4">
            <h2 className="font-semibold text-text-primary text-lg border-b border-border pb-2">
              Persona
            </h2>
            <input
              placeholder="Persona name"
              className="input-field"
              value={personaName}
              onChange={(e) => setPersonaName(e.target.value)}
            />
            <input
              placeholder="Persona role"
              className="input-field"
              value={personaRole}
              onChange={(e) => setPersonaRole(e.target.value)}
            />
            <textarea
              placeholder="Persona system prompt"
              className="input-field"
              rows={8}
              value={personaPrompt}
              onChange={(e) => setPersonaPrompt(e.target.value)}
            />
            <input
              placeholder="Simli face ID"
              className="input-field"
              value={simliFaceId}
              onChange={(e) => setSimliFaceId(e.target.value)}
            />
          </section>
        </div>

        <div className="space-y-6">
          <section className="card-surface p-6 space-y-4">
            <h2 className="font-semibold text-text-primary text-lg border-b border-border pb-2">
              Scenario
            </h2>
            <textarea
              placeholder="Product context — what the student is selling"
              className="input-field min-h-[200px]"
              rows={10}
              value={productContext}
              onChange={(e) => setProductContext(e.target.value)}
            />
          </section>

          <section className="card-surface p-6">
            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded border-border text-accent focus:ring-accent"
              />
              Publish immediately
            </label>
          </section>

          {error && (
            <p className="text-sm text-error border border-error/30 bg-error/5 rounded-md p-3">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => void handleSave(false)}
              className="px-5 py-2 border border-border rounded-md text-sm text-text-primary hover:bg-surface"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => void handleSave(true)}
              className="btn-primary"
            >
              {isLoading ? "Saving…" : "Publish"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
