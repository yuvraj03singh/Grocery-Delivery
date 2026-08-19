import { useEffect, useState } from "react";
import type { Order } from "../types";
import { useCart } from "../context/CartContext";
import { statusColors } from "../assets/assets";
import Loading from "../components/Loading";
import { ChevronRightIcon, CalendarIcon, PackageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast/headless";
import api from "../config/api";

const MyOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchParams, setSearchParams] = useState(
    new URLSearchParams(window.location.search),
  );
  const tabs = ["All", "Placed", "Out for Delivery", "Delivered"];

  const { clearCart } = useCart();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = activeTab === "All" ? "" : `?status=${encodeURIComponent(activeTab)}`;
      const { data } = await api.get(`/orders${params}`);
      setOrders(data.orders);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error?.message || "Unable to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("clearCart") === "true") {
      clearCart();
      setSearchParams(new URLSearchParams(window.location.search));
      setTimeout(() => {
        fetchOrders();
      }, 1000);
    }
    fetchOrders();
  }, [activeTab]);

  const filteredOrders =
    activeTab.toLowerCase() === "all"
      ? orders
      : orders.filter(
        (o) => o.status.toLowerCase() === activeTab.toLowerCase(),
      );

  return (
    <div className="min-h-screen bg-app-cream mb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-semibold text-app-green mb-6">
          My Orders
        </h1>

        {/*tabs*/}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors duration-200 ${activeTab.toLowerCase() === tab.toLowerCase()
                  ? "bg-app-green text-white"
                  : "bg-white text-app-text-light hover:bg-app-cream-dark border border-app-border"
                }`}
            >
              {tab.toLowerCase() === "all" ? "All orders" : tab}
            </button>
          ))}
        </div>

        {/*orders list*/}

        {loading ? (
          <Loading />
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <PackageIcon className="size-16 text-app-border mx-auto mb-4" />
            <h2 className="text-sm text-app-green mb-2">No orders found</h2>

            <p className="text-sm text-app-text-light mb-4">
              Start Shopping to see your orders here!
            </p>
            <Link
              to="/products"
              className="inline-flex px-4 py-2 bg-app-green text-white text-sm rounded-lg"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block max-w-4xl bg-white rounded-2xl p-5 hover:shadow-md transition-all border border-app-border/50"
              >
                {/* Order details */}
                <div className="flex items-start justify-between mb-3">
                  {/*left*/}
                  <div>
                    <p className="text-sm font-medium text-app-green">
                      Order #{order.id.slice(-8).toUpperCase()}
                    </p>

                    <div className="flex items-center gap-2 mt-1">
                      <CalendarIcon className="size-3 text-app-text-light" />
                      <span className="text-xs text-app-text-light">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/*right*/}
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-4 py-1 text-xs font-medium rounded-full ${statusColors[order.status] ||
                        "bg-gray-100 text-gray-800"
                        }`}
                    >
                      {order.status}
                    </span>
                    <ChevronRightIcon className="size-3 text-app-text-light" />
                  </div>
                </div>

                {/*items*/}
                <div className="flex items-center gap-2 mb-3">
                  {order.items.slice(0, 4).map((item, i) => (
                    <img
                      key={i}
                      src={item.image}
                      alt={item.name}
                      className="size-12 sm:size-16 rounded-lg object-cover border border-app-border"
                    />
                  ))}
                  {order.items.length > 4 && (
                    <div className="size-12 sm:size-16 rounded-lg bg-app-cream flex-center text-xs font-semibold text-app-text-light">
                      +{order.items.length - 4} more
                    </div>
                  )}
                </div>

                {/*total*/}
                <div className="flex justify-between items-center pt-3 text-sm">
                  <span className="text-app-text-light">
                    {order.items.length} items
                  </span>
                  <span className="font-semibold text-app-green">
                    Rs {order.total.toFixed(2)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
