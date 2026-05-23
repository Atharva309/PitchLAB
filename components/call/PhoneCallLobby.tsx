/**
 * PhoneCallLobby.tsx
 * Pre-call screen for prospecting: ringing animation, no Deepgram/ElevenLabs until join.
 */

"use client";

type PhoneCallLobbyProps = {
  personaName: string;
  personaRole: string;
  permissionError: string;
  canJoin: boolean;
  isPermissionPending: boolean;
  onJoinCall: () => void;
};

/**
 * Audio-only lobby before the prospecting cold call connects.
 */
export function PhoneCallLobby({
  personaName,
  personaRole,
  permissionError,
  canJoin,
  isPermissionPending,
  onJoinCall,
}: PhoneCallLobbyProps): React.ReactElement {
  return (
    <div className="relative min-h-[560px] rounded-xl overflow-hidden bg-call-background text-white flex flex-col items-center justify-center px-4">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-green-600/40 animate-ping" />
        <span className="absolute inset-2 rounded-full border border-green-600/30 animate-pulse" />
        <span className="text-4xl z-10">📞</span>
      </div>

      <p className="mt-8 text-xl font-semibold">Ready to call {personaName}?</p>
      <p className="text-sm text-gray-400 mt-1">{personaRole}</p>

      {permissionError.length > 0 && (
        <p className="text-sm text-red-400 mt-4 max-w-md text-center">{permissionError}</p>
      )}

      {isPermissionPending && (
        <p className="text-sm text-gray-500 mt-4">Requesting microphone access…</p>
      )}

      <button
        type="button"
        onClick={onJoinCall}
        disabled={!canJoin || isPermissionPending}
        className="mt-8 px-10 py-3.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-base font-semibold"
      >
        Join Call
      </button>
    </div>
  );
}
