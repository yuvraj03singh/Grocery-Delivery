import { useState } from "react";
import {
  CircleAlertIcon,
  MapPinIcon,
  NavigationIcon,
  PhoneIcon,
  ChevronDownIcon,
  ChevronUpIcon,
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
  const [showDetails, setShowDetails] = useState(false);

  return (
    <article className="bg-white rounded-2xl border border-app-border p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-zinc-900">
              Order {order.id.slice(-6)}
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
              {order.status === "Assigned" && (
                <button
                  onClick={() => handleUpdateStatus(order.id, "Packed")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-app-green text-white text-sm font-medium hover:bg-app-green-light transition-colors"
                >
                  Mark as Packed
                </button>
              )}
              {order.status === "Packed" && (
                <button
                  onClick={() => handleUpdateStatus(order.id, "Out for Delivery")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-app-green text-white text-sm font-medium hover:bg-app-green-light transition-colors"
                >
                  <NavigationIcon className="size-4" />
                  Out for Delivery
                </button>
              )}
              {order.status === "Out for Delivery" && (
                <button
                  onClick={() => setOtpModal(order.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-app-green text-white text-sm font-medium hover:bg-app-green-light transition-colors"
                >
                  Complete
                </button>
              )}
              
              <button
                onClick={() => setCancelModal(order.id)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-app-border text-zinc-700 text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-app-border text-zinc-700 text-sm font-medium hover:bg-app-cream transition-colors"
            >
              {showDetails ? "Hide" : "View"}
              {showDetails ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
            </button>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-app-border">
          <h4 className="text-sm font-semibold text-zinc-900 mb-3">Order Items</h4>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-zinc-50 border border-zinc-100" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{item.name}</p>
                  <p className="text-xs text-zinc-500">Qty: {item.quantity}</p>
                </div>
                <div className="text-sm font-semibold text-zinc-900">
                  Rs {(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
