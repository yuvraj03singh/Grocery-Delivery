import { XIcon } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

interface CancelModalProps {
  setCancelModal: Dispatch<SetStateAction<string | null>>;
  cancelReason: string;
  setCancelReason: Dispatch<SetStateAction<string>>;
  handleCancel: () => void;
  submitting: boolean;
}

export default function CancelModal({
  setCancelModal,
  cancelReason,
  setCancelReason,
  handleCancel,
  submitting,
}: CancelModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Cancel Delivery
          </h2>
          <button
            onClick={() => setCancelModal(null)}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <textarea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="Reason for cancellation"
          rows={4}
          className="w-full rounded-xl border border-app-border dark:border-zinc-700 bg-transparent dark:bg-zinc-800 dark:text-zinc-100 px-4 py-3 text-sm outline-none focus:border-app-green"
        />

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setCancelModal(null)}
            className="flex-1 rounded-xl border border-app-border dark:border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-app-cream dark:hover:bg-zinc-800"
          >
            Back
          </button>
          <button
            onClick={handleCancel}
            disabled={submitting || !cancelReason.trim()}
            className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {submitting ? "Cancelling..." : "Cancel Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
