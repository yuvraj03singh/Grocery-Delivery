import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRightIcon,
  ArrowLeft,
  CheckIcon,
  CreditCardIcon,
  MapPinIcon,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { dummyAddressData } from "../assets/assets";
import type { Address } from "../types";
import CheckoutAddress from "../components/Checkout/CheckoutAddress";
import CheckoutPayment from "../components/Checkout/CheckoutPayment";
import CheckoutReview from "../components/Checkout/CheckoutReview";

type Step = "address" | "payment" | "review";
type PaymentMethod = "cash" | "card";

const Checkout = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("address");
  const [loading, setLoading] = useState(false);

  const { items, cartTotal } = useCart();

  const dummyUser = {
    addresses: dummyAddressData as Address[],
  };

  const [address, setAddress] = useState<Address>({
    _id: "",
    label: "Home",
    address: "",
    city: "",
    state: "",
    zip: "",
    isDefault: false,
    lat: 0,
    lng: 0,
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const deliveryFee = cartTotal > 20 ? 0 : 1.99;
  const tax = cartTotal * 0.08;
  const total = cartTotal + deliveryFee + tax;

  const steps: Array<{
    key: Step;
    label: string;
    icon: typeof MapPinIcon;
  }> = [
    {
      key: "address",
      label: "Address",
      icon: MapPinIcon,
    },
    {
      key: "payment",
      label: "Payment",
      icon: CreditCardIcon,
    },
    {
      key: "review",
      label: "Review",
      icon: CheckIcon,
    },
  ];

  const handlePlaceOrder = async () => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      navigate("/orders");
    }, 400);
  };

  useEffect(() => {
    if (dummyUser.addresses.length > 0) {
      const defaultAddr =
        dummyUser.addresses.find((a) => a.isDefault) || dummyUser.addresses[0];

      setAddress({
        _id: defaultAddr?._id ?? "",
        label: defaultAddr?.label ?? "Home",
        address: defaultAddr?.address ?? "",
        city: defaultAddr?.city ?? "",
        state: defaultAddr?.state ?? "",
        zip: defaultAddr?.zip ?? "",
        isDefault: defaultAddr?.isDefault ?? false,
        lat: defaultAddr?.lat ?? 0,
        lng: defaultAddr?.lng ?? 0,
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-app-cream py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-app-text-light hover:text-app-green mb-6 transition-colors"
        >
          <ArrowLeft className="size-5" />
          Back
        </button>

        <h1 className="text-2xl font-semibold text-app-green mb-8">Checkout</h1>

        {/* Checkout Steps */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => {
            const Icon = s.icon;

            return (
              <div key={s.key} className="flex items-center gap-2">
                <button
                  onClick={() => setStep(s.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    step === s.key
                      ? "bg-app-green text-white"
                      : "bg-app-cream text-app-text-light hover:bg-app-green/10 hover:text-app-green"
                  }`}
                >
                  <Icon className="size-5" />
                  {s.label}

                  {i < steps.length - 1 && (
                    <ChevronRightIcon className="size-4 text-app-text-light" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Checkout Content */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            {/* Address */}
            {step === "address" && (
              <CheckoutAddress
                address={address}
                setAddress={setAddress}
                setStep={setStep}
                user={dummyUser}
              />
            )}

            {/* Payment */}
            {step === "payment" && (
              <CheckoutPayment
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                setStep={setStep}
              />
            )}

            {/* Review */}
            {step === "review" && (
              <CheckoutReview
                address={address}
                items={items}
                handlePlaceOrder={handlePlaceOrder}
                loading={loading}
                total={total}
              />
            )}
          </div>

          {/* Order Summary */}
          <aside className="bg-white rounded-2xl p-5 h-fit sticky top-24">
            <h3 className="text-sm font-semibold text-app-green mb-4">
              Order Summary
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-app-text-light">
                  Subtotal ({items.length} items)
                </span>
                <span>Rs {cartTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-app-text-light">Delivery</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="text-app-screen">Free</span>
                  ) : (
                    <span>Rs {deliveryFee.toFixed(2)}</span>
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-app-text-light">Tax</span>
                <span>Rs {tax.toFixed(2)}</span>
              </div>

              <div className="flex justify-between pt-3 border-t border-app-border text-base font-semibold">
                <span>Total</span>
                <span className="text-app-green">Rs {total.toFixed(2)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
