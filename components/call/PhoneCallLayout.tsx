/**
 * PhoneCallLayout.tsx
 * Active prospecting call: waveform visualisation, transcript, mute + end controls.
 */

"use client";

import { CallTranscript } from "@/components/call/CallTranscript";
import { getStageCallLabel } from "@/lib/stages";
import type { SimulationStage } from "@/types";

type PhoneCallLayoutProps = {
  stage: SimulationStage;
  personaName: string;
  formattedTimer: string;
  waveformLevels: number[];
  userTranscripts: string;
  personaTranscripts: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onEndCall: () => void;
};

/**
 * Full-screen phone UI while the prospecting voice session is live.
 */
export function PhoneCallLayout({
  stage,
  personaName,
  formattedTimer,
  waveformLevels,
  userTranscripts,
  personaTranscripts,
  isMuted,
  onToggleMute,
  onEndCall,
}: PhoneCallLayoutProps): React.ReactElement {
  const stageLabel = getStageCallLabel(stage);

  return (
    <div className="relative min-h-[560px] rounded-xl overflow-hidden bg-call-background text-white flex flex-col">
      <div className="flex justify-between items-center px-4 py-3">
        <span className="text-sm font-medium text-gray-300">{stageLabel}</span>
        <span className="text-sm font-mono text-gray-500 tabular-nums">{formattedTimer}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-2xl mb-4">
          📞
        </div>
        <p className="text-lg font-semibold">{personaName}</p>
        <p className="text-xs text-gray-500 mt-1">On call</p>

        <div className="flex items-end justify-center gap-1 h-16 mt-10 w-full max-w-xs">
          {waveformLevels.map((level, index) => (
            <div
              key={`bar-${index}`}
              className="w-1.5 rounded-full bg-green-500 transition-all duration-75"
              style={{ height: `${Math.round(level * 56) + 8}px` }}
            />
          ))}
        </div>
      </div>

      <div className="px-4 pb-4 space-y-3">
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
                : "bg-gray-800 border-gray-600 text-gray-200"
            }`}
          >
            {isMuted ? "🔇 Unmute" : "🎤 Mute"}
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
