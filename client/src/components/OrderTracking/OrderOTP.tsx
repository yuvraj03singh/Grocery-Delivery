import { KeyRoundIcon } from "lucide-react";

export default function OrderOTP({ order }: { order: any }) {
  if (order?.status === "Delivered") return null;
  const otp = order.deliveryOtp || "754730";

  return (
    <div className="bg-[#224233] rounded-2xl p-6 text-white shadow-xs">
      <div className="flex items-center gap-3 mb-5">
        <div className="size-11 rounded-full bg-white/10 flex-center shrink-0">
          <KeyRoundIcon className="size-5 text-white/90" />
        </div>
        <div>
          <h3 className="font-bold text-base tracking-tight text-white">
            Delivery OTP
          </h3>
          <p className="text-xs text-white/70 mt-0.5">
            Share this with your delivery partner
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        {otp.split("").map((digit: string, i: number) => (
          <div
            key={i}
            className="w-12 h-12 rounded-xl bg-[#325444] flex-center text-xl font-bold text-white shrink-0 shadow-inner"
          >
            {digit}
          </div>
        ))}
      </div>
    </div>
  );
}
