/**
 * CallControls.tsx
 * Start / end call button and status line from useVoiceSession.
 */

"use client";

type CallControlsProps = {
  isActive: boolean;
  onStart: () => void;
  onEnd: () => void;
  statusText: string;
};

/**
 * Renders call status text and a single toggle button for the voice session.
 */
export function CallControls({
  isActive,
  onStart,
  onEnd,
  statusText,
}: CallControlsProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-4 p-4 mt-6">
      <div className="h-6 flex items-center justify-center text-sm font-semibold tracking-wide text-gray-400 min-w-[200px]">
        {statusText}
      </div>
      <button
        type="button"
        onClick={isActive ? onEnd : onStart}
        className={`px-10 py-4 rounded-full text-white font-bold text-xl transition-all shadow-xl hover:scale-105 active:scale-95 ${
          isActive
            ? "bg-red-500 hover:bg-red-600 shadow-red-900/50"
            : "bg-green-500 hover:bg-green-600 shadow-green-900/50"
        }`}
      >
        {isActive ? "End Call" : "Start Call"}
      </button>
    </div>
  );
}
