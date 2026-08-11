import {
  CircleAlertIcon,
  MapPinIcon,
  NavigationIcon,
  PhoneIcon,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { Order } from "../../types";
import { statusColors } from "../../assets/assets";

interface DeliveryOrderCardProps {
  order: Order;
  tab: "active" | "completed";
  handleUpdateStatus: (orderId: string, status: string) => void;
  setOtpModal: Dispatch<SetStateAction<string | null>>;
  setCancelModal: Dispatch<SetStateAction<string | null>>;
}

export default function DeliveryOrderCard({
  order,
  tab,
  handleUpdateStatus,
  setOtpModal,
  setCancelModal,
}: DeliveryOrderCardProps) {
  const customer = typeof order.user === "string" ? null : order.user;

  return (
    <article className="bg-white rounded-2xl border border-app-border p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-zinc-900">
              Order {order._id.slice(-6)}
            </h3>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[order.status] || "bg-zinc-100 text-zinc-600"}`}
            >
              {order.status}
            </span>
          </div>

          <div className="flex flex-col gap-2 text-sm text-zinc-600">
            <div className="flex items-center gap-2">
              <MapPinIcon className="size-4 text-app-green" />
              <span className="truncate">
                {order.shippingAddress.address}, {order.shippingAddress.city},{" "}
                {order.shippingAddress.state}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <PhoneIcon className="size-4 text-app-green" />
              <span>{customer?.phone || "Customer contact unavailable"}</span>
            </div>
            <div className="flex items-center gap-2">
              <CircleAlertIcon className="size-4 text-app-green" />
              <span>
                {order.items.length} items • Rs {order.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {tab === "active" ? (
            <>
              <button
                onClick={() => setOtpModal(order._id)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-app-green text-white text-sm font-medium hover:bg-app-green-light transition-colors"
              >
                <NavigationIcon className="size-4" />
                Complete
              </button>
              <button
                onClick={() => setCancelModal(order._id)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-app-border text-zinc-700 text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => handleUpdateStatus(order._id, "Delivered")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-app-border text-zinc-700 text-sm font-medium hover:bg-app-cream transition-colors"
            >
              View
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
