/**
 * CallLobby.tsx
 * Pre-call waiting room: persona placeholder, student PiP preview, Join Call CTA.
 * Simli is not mounted here — zero WebRTC until join.
 */

"use client";

import { PIP_HEIGHT_PX, PIP_WIDTH_PX } from "@/lib/constants";

type CallLobbyProps = {
  personaName: string;
  personaRole: string;
  permissionError: string;
  canJoin: boolean;
  isPermissionPending: boolean;
  studentVideoRef: React.RefCallback<HTMLVideoElement | null>;
  showStudentPip: boolean;
  cameraUnavailable: boolean;
  onJoinCall: () => void;
};

/**
 * Full-screen lobby shown before the student joins a Simli video call.
 */
export function CallLobby({
  personaName,
  personaRole,
  permissionError,
  canJoin,
  isPermissionPending,
  studentVideoRef,
  showStudentPip,
  cameraUnavailable,
  onJoinCall,
}: CallLobbyProps): React.ReactElement {
  return (
    <div className="relative min-h-[560px] rounded-xl overflow-hidden bg-[#0a0a0a] text-white">
      {/* Host placeholder — blurred card */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="w-full max-w-lg aspect-video rounded-2xl overflow-hidden border border-gray-800 bg-gray-900/80 backdrop-blur-md relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black opacity-90" />
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-700/80 flex items-center justify-center text-2xl font-bold text-gray-300 mb-4">
              {personaName.charAt(0)}
            </div>
            <p className="text-lg font-semibold">{personaName}</p>
            <p className="text-sm text-gray-400 mt-1">{personaRole}</p>
            <p className="text-xs text-gray-500 mt-3">Waiting to join…</p>
          </div>
        </div>
      </div>

      {/* Student PiP preview */}
      {showStudentPip && (
        <div
          className="absolute bottom-6 right-6 z-20 rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl bg-black"
          style={{ width: PIP_WIDTH_PX, height: PIP_HEIGHT_PX }}
        >
          <video
            ref={studentVideoRef}
            className="w-full h-full object-cover scale-x-[-1]"
            autoPlay
            playsInline
            muted
          />
        </div>
      )}
      {cameraUnavailable && (
        <div
          className="absolute bottom-6 right-6 z-20 rounded-xl border border-gray-700 bg-gray-900/90 px-3 py-2 text-xs text-gray-400"
          style={{ width: PIP_WIDTH_PX }}
        >
          Camera unavailable
        </div>
      )}

      {/* Center copy + CTA */}
      <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center pb-10 px-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent pt-24">
        <p className="text-xl font-semibold">Ready to meet {personaName}?</p>
        <p className="text-sm text-gray-400 mt-1">
          {personaRole}
        </p>

        {permissionError.length > 0 && (
          <p className="text-sm text-red-400 mt-4 max-w-md text-center">{permissionError}</p>
        )}

        {isPermissionPending && (
          <p className="text-sm text-gray-500 mt-4">Requesting camera and microphone…</p>
        )}

        <button
          type="button"
          onClick={onJoinCall}
          disabled={!canJoin || isPermissionPending}
          className="mt-6 px-10 py-3.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-base font-semibold"
        >
          Join Call
        </button>
      </div>

    </div>
  );
}
