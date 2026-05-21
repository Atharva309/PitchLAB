/**
 * EndCallModal.tsx
 * Confirmation dialog before ending a live call and moving to scoring.
 */

"use client";

type EndCallModalProps = {
  personaName: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Modal overlay asking the student to confirm ending the call.
 */
export function EndCallModal({
  personaName,
  onConfirm,
  onCancel,
}: EndCallModalProps): React.ReactElement {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-call-title"
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <h2 id="end-call-title" className="text-lg font-semibold text-white">
          End this call?
        </h2>
        <p className="text-sm text-gray-400 mt-2">
          Your conversation with {personaName} will be scored. You cannot return to this call
          after ending it.
        </p>
        <div className="flex gap-3 mt-6 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-300 border border-gray-600 rounded hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700"
          >
            End call
          </button>
        </div>
      </div>
    </div>
  );
}
