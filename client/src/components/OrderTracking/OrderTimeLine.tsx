import { ClockIcon, CheckIcon, TruckIcon, PackageIcon, CheckCircle2Icon } from "lucide-react";

export default function OrderTimeLine({ order }: { order: any }) {
  const allStatuses = ["Placed", "Confirmed", "Assigned", "Packed", "Out for Delivery", "Delivered"];
  const currentIdx = allStatuses.indexOf(order.status);

  const statusIcons: any = {
    Placed: ClockIcon,
    Confirmed: CheckIcon,
    Assigned: TruckIcon,
    Packed: PackageIcon,
    "Out for Delivery": TruckIcon,
    Delivered: CheckCircle2Icon,
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-app-border shadow-xs">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-app-border">
        <h2 className="text-base font-semibold text-app-green">Delivery Progress</h2>
        <span className="text-xs text-app-text-light font-medium">
          Step {Math.max(1, currentIdx + 1)} of {allStatuses.length}
        </span>
      </div>

      <div className="space-y-0 pl-1">
        {allStatuses.map((status, i) => {
          const Icon = statusIcons[status] || PackageIcon;
          const isCompleted = i <= currentIdx;
          const isCurrent = i === currentIdx;
          const isLast = i === allStatuses.length - 1;

          const historyEntry = order.statusHistory?.find((h: any) => h.status === status);

          return (
            <div key={status} className="flex gap-4">
              {/* Stepper Icon & Connecting Line */}
              <div className="flex flex-col items-center">
                <div
                  className={`size-9 rounded-full flex-center shrink-0 transition-all duration-300 ${
                    isCompleted
                      ? "bg-app-green text-white shadow-xs"
                      : "bg-app-cream text-app-text-light border border-app-border"
                  } ${isCurrent ? "ring-4 ring-app-green/20 scale-105" : ""}`}
                >
                  <Icon className="size-4.5" />
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 my-1 min-h-[36px] transition-colors duration-300 ${
                      i < currentIdx ? "bg-app-green" : "bg-app-border"
                    }`}
                  />
                )}
              </div>

              {/* Status Content */}
              <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${isCompleted ? "text-app-green" : "text-app-text-light"}`}>
                    {status}
                  </p>
                  {isCurrent && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-app-orange/15 text-app-orange rounded-full animate-pulse">
                      In Progress
                    </span>
                  )}
                </div>
                {historyEntry && (
                  <p className="text-xs text-app-text-light mt-0.5 font-medium">
                    {new Date(historyEntry.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {historyEntry.note && <span className="text-app-text/60 ml-1.5">• {historyEntry.note}</span>}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
