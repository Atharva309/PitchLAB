/**
 * VideoCallStage.tsx
 * Video-call layout for Simli stages: avatar stays visible; mic is separate from disconnect.
 */

"use client";

import { Avatar } from "@/components/Avatar";
import { Transcript } from "@/components/Transcript";
import type { AvatarRef } from "@/types";

type VideoCallStageProps = {
  avatarRef: React.RefObject<AvatarRef>;
  personaName: string;
  isListening: boolean;
  statusText: string;
  userTranscripts: string;
  personaTranscripts: string;
  onJoinCall: () => void;
  onLeaveCall: () => void;
  onFinishStage: () => void;
  isFinishDisabled?: boolean;
  finishLabel?: string;
};

/**
 * Renders full-width video call UI with persistent avatar and transcript.
 */
export function VideoCallStage({
  avatarRef,
  personaName,
  isListening,
  statusText,
  userTranscripts,
  personaTranscripts,
  onJoinCall,
  onLeaveCall,
  onFinishStage,
  isFinishDisabled = false,
  finishLabel = "Finish stage",
}: VideoCallStageProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl overflow-hidden border border-gray-800 bg-gray-950 text-white">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
          <div>
            <p className="text-sm font-semibold">{personaName}</p>
            <p className="text-xs text-gray-400">{statusText}</p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded ${
              isListening ? "bg-green-900 text-green-200" : "bg-gray-800 text-gray-400"
            }`}
          >
            {isListening ? "Live" : "Ready"}
          </span>
        </div>

        <div className="flex justify-center p-4 bg-black min-h-[320px]">
          <div className="w-full max-w-lg">
            <Avatar ref={avatarRef} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-center px-4 py-3 border-t border-gray-800 bg-gray-900">
          {!isListening ? (
            <button
              type="button"
              onClick={onJoinCall}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium"
            >
              Join call
            </button>
          ) : (
            <button
              type="button"
              onClick={onLeaveCall}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
            >
              Mute & leave call
            </button>
          )}
          <button
            type="button"
            onClick={onFinishStage}
            disabled={isFinishDisabled}
            className="px-5 py-2 border border-gray-600 rounded text-sm disabled:opacity-50"
          >
            {finishLabel}
          </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Live transcript</p>
        <Transcript userText={userTranscripts} danaText={personaTranscripts} />
        <p className="text-xs text-gray-500 mt-2">
          Wait until {personaName} finishes speaking before you talk.
        </p>
      </div>
    </div>
  );
}
