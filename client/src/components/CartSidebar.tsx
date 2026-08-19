import {
  ArrowRightIcon,
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const CartSidebar = () => {
  const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "₹";

  const {
    items,
    updateQuantity,
    removeFromCart,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  const navigate = useNavigate();

  const deliveryFee = cartTotal > 20 ? 0 : 1.99;
  const grandTotal = cartTotal + deliveryFee;

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-[1px]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-app-border">
              <div className="flex items-center gap-2">
                <ShoppingBagIcon className="size-5 text-app-green" />

                <h2 className="text-lg font-medium text-app-green">
                  Your Cart
                </h2>

                <span className="px-2 py-0.5 text-xs font-semibold bg-app-cream text-app-green rounded-full">
                  {items.length} items
                </span>
              </div>

              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-xl hover:bg-app-cream transition-colors text-app-text-light hover:text-app-text cursor-pointer"
              >
                <XIcon className="size-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBagIcon className="size-16 text-app-border mb-4" />

                  <h3 className="text-app-gray">Your cart is empty</h3>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex bg-app-cream/60 rounded-xl gap-4 p-2 items-center"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="size-16 object-cover rounded-lg shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold truncate text-app-green">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-app-text-light">
                        {currency}
                        {item.product.price.toFixed(2)}/{item.product.unit}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                            className="size-7 rounded-lg bg-white border border-app-border flex-center hover:bg-zinc-100 transition-colors cursor-pointer"
                          >
                            <MinusIcon className="size-3" />
                          </button>
                          <span className="text-sm font-semibold w-6 text-center">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                            className="size-7 rounded-lg bg-white border border-app-border flex-center hover:bg-zinc-100 transition-colors cursor-pointer"
                          >
                            <PlusIcon className="size-3" />
                          </button>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-app-green">
                              {currency}
                              {(item.product.price * item.quantity).toFixed(2)}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-app-text-light hover:text-red-500 transition-colors p-1 cursor-pointer"
                            >
                              <Trash2Icon className="size-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-5 border-t border-app-border space-y-4 bg-white">
                <div className="flex justify-between text-sm">
                  <span className="text-app-text-light">Total:</span>
                  <span className="font-semibold text-app-green">
                    {currency}
                    {cartTotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-app-text-light">Delivery Fee:</span>
                  <span className="font-semibold">
                    {deliveryFee === 0 ? (
                      <span className="text-app-success">Free</span>
                    ) : (
                      `${currency}${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>

                {deliveryFee > 0 && (
                  <p className="text-sm text-app-text-light text-center">
                    Free delivery on orders over {currency}100
                  </p>
                )}

                <div className="flex justify-between text-base font-semibold border-t border-app-border pt-3">
                  <span className="text-app-green">Grand Total:</span>
                  <span className="text-app-green">
                    {currency}
                    {grandTotal.toFixed(2)}
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate("/checkout");
                  }}
                  className="w-full py-3.5 bg-app-orange text-white font-semibold rounded-xl hover:bg-app-orange-dark transition-colors flex-center gap-2 shadow-lg shadow-app-orange/20 cursor-pointer"
                >
                  Proceed to Checkout{" "}
                  <ArrowRightIcon className="size-4 inline-block ml-1" />
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;
