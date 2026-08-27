import { CheckCircle2Icon, XIcon } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

interface OtpModalProps {
  setOtpModal: Dispatch<SetStateAction<string | null>>;
  otp: string;
  setOtp: Dispatch<SetStateAction<string>>;
  handleComplete: () => void;
  submitting: boolean;
}

export default function OtpModal({
  setOtpModal,
  otp,
  setOtp,
  handleComplete,
  submitting,
}: OtpModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <CheckCircle2Icon className="size-5 text-app-green" /> Verify OTP
          </h2>
          <button
            onClick={() => setOtpModal(null)}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Enter the order OTP to mark this delivery as complete.
        </p>

        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          className="w-full rounded-xl border border-app-border dark:border-zinc-700 bg-transparent dark:bg-zinc-800 dark:text-zinc-100 px-4 py-3 text-sm outline-none focus:border-app-green"
        />

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setOtpModal(null)}
            className="flex-1 rounded-xl border border-app-border dark:border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-app-cream dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={handleComplete}
            disabled={submitting}
            className="flex-1 rounded-xl bg-app-green px-4 py-3 text-sm font-medium text-white hover:bg-app-green-light disabled:opacity-60"
          >
            {submitting ? "Verifying..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
