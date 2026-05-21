/**
 * CallTranscript.tsx
 * Dark-themed scrolling transcript for video and phone call stages.
 */

"use client";

import { useEffect, useRef } from "react";

type CallTranscriptProps = {
  userText: string;
  personaText: string;
  personaLabel?: string;
};

/**
 * Renders student (left) and persona (right) bubbles on a dark call UI.
 */
export function CallTranscript({
  userText,
  personaText,
  personaLabel = "Dana",
}: CallTranscriptProps): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [userText, personaText]);

  const hasContent = userText.length > 0 || personaText.length > 0;

  return (
    <div
      ref={scrollRef}
      className="max-h-32 overflow-y-auto rounded-lg bg-black/50 border border-gray-800 px-4 py-3"
    >
      <div className="flex flex-col gap-2 text-sm">
        {userText.length > 0 && (
          <div className="flex justify-start">
            <span className="text-gray-300 bg-gray-800/90 px-3 py-2 rounded-2xl rounded-tl-sm max-w-[85%]">
              {userText}
            </span>
          </div>
        )}
        {personaText.length > 0 && (
          <div className="flex justify-end">
            <span className="text-blue-100 bg-blue-950/80 border border-blue-900/50 px-3 py-2 rounded-2xl rounded-tr-sm max-w-[85%]">
              {personaText}
            </span>
          </div>
        )}
        {!hasContent && (
          <p className="text-center text-gray-500 text-xs italic">Live transcript will appear here…</p>
        )}
      </div>
    </div>
  );
}
