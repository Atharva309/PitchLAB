/**
 * CallLayout.tsx
 * Active Simli video-call chrome: header, draggable student PiP, transcript, controls.
 * Persona video (Avatar) is rendered by the parent behind this layer — not remounted here.
 */

"use client";

import { useCallback, useRef, useState } from "react";
import { CallTranscript } from "@/components/call/CallTranscript";
import { PIP_HEIGHT_PX, PIP_WIDTH_PX } from "@/lib/constants";

type CallLayoutProps = {
  stageLabel: string;
  formattedTimer: string;
  personaName: string;
  studentVideoRef: React.RefCallback<HTMLVideoElement | null>;
  showStudentPip: boolean;
  cameraUnavailable: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  userTranscripts: string;
  personaTranscripts: string;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
};

/**
 * Overlay UI for an in-progress Simli video call (avatar video sits beneath z-0).
 */
export function CallLayout({
  stageLabel,
  formattedTimer,
  personaName,
  studentVideoRef,
  showStudentPip,
  cameraUnavailable,
  isMuted,
  isCameraOff,
  userTranscripts,
  personaTranscripts,
  onToggleMute,
  onToggleCamera,
  onEndCall,
}: CallLayoutProps): React.ReactElement {
  const [pipPos, setPipPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null
  );

  const onPipPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): void => {
      dragRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        originX: pipPos.x,
        originY: pipPos.y,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [pipPos.x, pipPos.y]
  );

  const onPipPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>): void => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    setPipPos({
      x: dragRef.current.originX + dx,
      y: dragRef.current.originY + dy,
    });
  }, []);

  const onPipPointerUp = useCallback((): void => {
    dragRef.current = null;
  }, []);

  return (
    <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
      <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
        <span className="text-sm font-medium text-gray-200">{stageLabel}</span>
        <span className="text-sm font-mono text-gray-400 tabular-nums">{formattedTimer}</span>
      </div>

      <div className="flex-1 relative">
        {showStudentPip && (
          <div
            className="absolute z-30 cursor-grab active:cursor-grabbing rounded-xl overflow-hidden border-2 border-gray-600 shadow-2xl bg-black touch-none pointer-events-auto"
            style={{
              width: PIP_WIDTH_PX,
              height: PIP_HEIGHT_PX,
              right: 24,
              bottom: 24,
              transform: `translate(${pipPos.x}px, ${pipPos.y}px)`,
            }}
            onPointerDown={onPipPointerDown}
            onPointerMove={onPipPointerMove}
            onPointerUp={onPipPointerUp}
            onPointerCancel={onPipPointerUp}
          >
            <video
              ref={studentVideoRef}
              className={`w-full h-full object-cover scale-x-[-1] ${isCameraOff ? "opacity-0" : "opacity-100"}`}
              autoPlay
              playsInline
              muted
            />
            {isCameraOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-xs text-gray-500">
                Camera off
              </div>
            )}
          </div>
        )}
        {cameraUnavailable && !showStudentPip && (
          <div
            className="absolute z-30 rounded-lg border border-gray-700 bg-gray-900/90 px-2 py-1 text-xs text-gray-500 pointer-events-auto"
            style={{ right: 24, bottom: 24 }}
          >
            Camera unavailable
          </div>
        )}
      </div>

      <div className="px-4 pb-4 pt-2 bg-gradient-to-t from-[#0a0a0a] to-transparent space-y-3 pointer-events-auto">
        <CallTranscript
          userText={userTranscripts}
          personaText={personaTranscripts}
          personaLabel={personaName}
        />
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onToggleMute}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium border ${
              isMuted
                ? "bg-red-900/50 border-red-700 text-red-200"
                : "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
            }`}
          >
            {isMuted ? "🔇 Unmute" : "🎤 Mute"}
          </button>
          <button
            type="button"
            onClick={onToggleCamera}
            disabled={cameraUnavailable}
            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-800 border border-gray-600 text-gray-200 hover:bg-gray-700 disabled:opacity-40"
          >
            {isCameraOff ? "📷 Camera on" : "📷 Camera off"}
          </button>
          <button
            type="button"
            onClick={onEndCall}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white"
          >
            📞 End Call
          </button>
        </div>
      </div>
    </div>
  );
}
