/**
 * Transcript.tsx
 * Live conversation display for the user and Dana lines.
 * Receives plain strings from useVoiceSession state.
 */

"use client";

type TranscriptProps = {
  userText: string;
  danaText: string;
};

/**
 * Shows the latest user and Dana transcript bubbles (or a waiting placeholder).
 */
export function Transcript({ userText, danaText }: TranscriptProps): React.ReactElement {
  const hasContent = userText.length > 0 || danaText.length > 0;

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto mt-6 bg-gray-900/80 backdrop-blur-md rounded-xl shadow-2xl min-h-[140px] p-6 border border-gray-800">
      <div className="text-gray-500 uppercase tracking-widest text-xs font-bold mb-4 border-b border-gray-800 pb-2">
        Live Transcript
      </div>

      <div className="flex flex-col justify-end flex-grow gap-3">
        {userText.length > 0 && (
          <div className="flex items-start gap-3">
            <span className="shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
              You
            </span>
            <div className="text-gray-300 text-md bg-gray-800 p-3 rounded-2xl rounded-tl-sm">
              {userText}
            </div>
          </div>
        )}

        {danaText.length > 0 && (
          <div className="flex items-start gap-3 flex-row-reverse">
            <span className="shrink-0 w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-200">
              Dana
            </span>
            <div className="text-blue-200 text-md bg-blue-900/40 border border-blue-800/50 p-3 rounded-2xl rounded-tr-sm">
              {danaText}
            </div>
          </div>
        )}

        {!hasContent && (
          <div className="text-center text-gray-600 italic mt-2">
            Waiting for conversation to begin...
          </div>
        )}
      </div>
    </div>
  );
}
