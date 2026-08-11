import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import type { Order } from "../types";
import { dummyDashboardOrdersData } from "../assets/assets";
import Loading from "../components/Loading";
import { ArrowLeftIcon, PhoneIcon, MapPinIcon, UserIcon } from "lucide-react";

import OrderOTP from "../components/OrderTracking/OrderOTP";
import LiveMap from "../components/OrderTracking/LiveMap";
import OrderTimeLine from "../components/OrderTracking/OrderTimeLine";

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const foundOrder = dummyDashboardOrdersData.find((o) => o._id === id);
    setOrder((foundOrder as any) || null);
    setLoading(false);
  }, [id]);

  if (loading) return <Loading />;

  if (!order) {
    return (
      <div className="min-h-screen bg-app-cream flex-center flex-col p-8 text-center">
        <div className="size-16 rounded-full bg-app-green/10 flex-center mb-4 text-app-green">
          <MapPinIcon className="size-8" />
        </div>
        <h2 className="text-xl font-bold text-app-green mb-2">
          Order Not Found
        </h2>
        <p className="text-sm text-app-text-light mb-6 max-w-sm">
          We couldn't find the details for this order. It may have been removed
          or the ID is invalid.
        </p>
        <button
          onClick={() => navigate("/orders")}
          className="px-5 py-2.5 bg-app-green text-white rounded-xl text-sm font-semibold hover:bg-app-dark-green transition-colors shadow-xs"
        >
          Back to My Orders
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen mb-20 bg-[#FAF7F2]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate("/orders")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-6 font-medium transition-colors"
        >
          <ArrowLeftIcon className="size-4" />
          <span>Back to Orders</span>
        </button>

        {/* Order Header: ID, Date, Status */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Order #{order._id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          <div>
            <span
              className={`px-5 py-2 text-sm font-semibold rounded-full inline-block ${
                order.status === "Delivered"
                  ? "bg-green-100 text-green-700"
                  : order.status === "Cancelled"
                    ? "bg-red-100 text-red-700"
                    : "bg-[#FDEEDC] text-[#E07A5F]"
              }`}
            >
              {order.status}
            </span>
          </div>
        </div>

        {/* 2-Column Responsive Layout matching reference screenshot */}
        <div className="grid gap-6 lg:grid-cols-3 items-start">
          {/* Left Column (Wider - 2 cols): OTP on top, Live Map below */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1 & 2. Delivery OTP and Live Map Cards (Hidden if order is Delivered) */}
            {order.status !== "Delivered" && (
              <>
                <OrderOTP order={order} />
                <LiveMap
                  order={order}
                  liveLocation={(order as any).liveLocation}
                />
              </>
            )}

            {/* 3. Delivery Progress Timeline */}
            <OrderTimeLine order={order} />

            {/* 4. Delivery Executive Info */}
            {order.deliveryPartner && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <h3 className="text-base font-bold text-gray-900">
                    Assigned Delivery Partner
                  </h3>
                  <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                    On the way
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="size-12 rounded-2xl bg-app-green/10 flex-center text-app-green font-bold shrink-0">
                      <UserIcon className="size-6 text-app-green" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-base">
                        {order.deliveryPartner.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Delivery Executive • ★ 4.9 Rating
                      </p>
                    </div>
                  </div>
                  {order.deliveryPartner.phone && (
                    <a
                      href={`tel:${order.deliveryPartner.phone}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-app-green text-white rounded-xl text-sm font-semibold hover:bg-app-dark-green transition-colors shadow-xs"
                    >
                      <PhoneIcon className="size-4" />
                      <span>Call Driver</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Sidebar - 1 col): Address on top, Items Summary below */}
          <div className="lg:col-span-1 space-y-6">
            {/* 1. Delivery Address Card (Top Right) */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100">
              <div className="flex items-center gap-2 mb-3 text-gray-900 font-bold text-base">
                <MapPinIcon className="size-5 text-gray-700" />
                <span>Delivery Address</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1 leading-relaxed">
                <p className="font-semibold text-gray-900">
                  {order.shippingAddress.label}
                </p>
                <p>{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.city} , {order.shippingAddress.state}{" "}
                  {order.shippingAddress.zip}
                </p>
              </div>
            </div>

            {/* 2. Items & Financial Summary Card (Bottom Right) */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100">
              <h3 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                Items ({order.items.length})
              </h3>

              {/* Items List */}
              <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="size-12 rounded-xl object-cover bg-gray-50 p-1 border border-gray-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          x{item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 shrink-0">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="mt-6 pt-4 border-t border-gray-100 space-y-2.5 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    ₹{order.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="font-semibold text-gray-900">
                    {order.deliveryFee === 0
                      ? "Free"
                      : `₹${order.deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span className="font-semibold text-gray-900">
                    ₹{order.tax.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 pt-3 border-t border-gray-100">
                  <span>Total</span>
                  <span>₹{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
