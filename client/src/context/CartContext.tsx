import { createContext, useContext, useEffect, useState } from "react";
import type { CartItem, Product } from "../types";

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  addMultipleToCart: (productsToAdd: { product: Product; quantity: number }[], openSidebar?: boolean) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * The CartProvider component maintains the global shopping cart state.
 * It persists cart items to local storage and exposes methods to manage the cart.
 * 
 * @param children - Child React components that need access to the cart.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("app_cart");
    return saved ? JSON.parse(saved) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("app_cart", JSON.stringify(items));
  }, [items]);

  /**
   * Adds a product to the shopping cart. If the product is already in the cart,
   * it increments the quantity by the specified amount.
   * Also automatically opens the cart sidebar.
   * 
   * @param product - The product object to add.
   * @param quantity - The number of units to add (defaults to 1).
   */
  const addToCart = (product: Product, quantity: number = 1) => {
    setItems((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);

      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }

      return [...prev, { product, quantity }];
    });

    setIsCartOpen(true);
  };

  /**
   * Adds multiple products to the shopping cart in a single batch operation.
   * 
   * @param productsToAdd - Array of items with product and quantity
   * @param openSidebar - Whether to open the cart drawer (default true)
   */
  const addMultipleToCart = (
    productsToAdd: { product: Product; quantity: number }[],
    openSidebar: boolean = true
  ) => {
    setItems((prev) => {
      let updated = [...prev];

      for (const itemToAdd of productsToAdd) {
        if (!itemToAdd.product || !itemToAdd.quantity || itemToAdd.quantity <= 0) continue;
        const existingIndex = updated.findIndex((i) => i.product.id === itemToAdd.product.id);

        if (existingIndex > -1) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + itemToAdd.quantity,
          };
        } else {
          updated.push({
            product: itemToAdd.product,
            quantity: itemToAdd.quantity,
          });
        }
      }

      return updated;
    });

    if (openSidebar) {
      setIsCartOpen(true);
    }
  };

  /**
   * Removes an entire product entry from the shopping cart regardless of its quantity.
   * 
   * @param productId - The unique ID of the product to remove.
   */
  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  /**
   * Directly sets the quantity of a specific item in the cart.
   * If the quantity is set to 0 or less, the item is removed.
   * 
   * @param productId - The unique ID of the product.
   * @param quantity - The new absolute quantity.
   */
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item,
      ),
    );
  };

  /**
   * Empties the shopping cart entirely and closes the cart sidebar.
   */
  const clearCart = () => {
    setItems([]);
    setIsCartOpen(false);
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        addMultipleToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/**
 * Custom hook to consume the CartContext.
 * Must be used within a component wrapped by the `<CartProvider>`.
 * 
 * @returns The cart state and modifier methods.
 */
export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
