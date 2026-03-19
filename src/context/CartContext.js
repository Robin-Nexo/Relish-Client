'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  // cart is an array of menu item objects each with a `quantity` field
  const [cart, setCart] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [tableNumber, setTableNumber] = useState(null);

  /**
   * Initialise cart from Firestore menuItems.
   * Each item gets quantity: 0.
   */
  const setMenuItems = useCallback((items) => {
    setCart(items.map((item) => ({ ...item, quantity: 0 })));
  }, []);

  const addToCart = useCallback((item) => {
    setCart((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      )
    );
  }, []);

  const removeFromCart = useCallback((item) => {
    setCart((prev) =>
      prev.map((i) =>
        i.id === item.id && i.quantity > 0
          ? { ...i, quantity: i.quantity - 1 }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart((prev) => prev.map((i) => ({ ...i, quantity: 0 })));
  }, []);

  // Computed totals
  const subtotal = cart.reduce(
    (acc, i) => acc + (i.quantity > 0 ? parseFloat(i.price || 0) * i.quantity : 0),
    0
  );
  const tax = parseFloat(((5 * subtotal) / 100).toFixed(2));
  const grandTotal = parseFloat((subtotal + tax).toFixed(2));
  const itemCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <CartCtx.Provider
      value={{
        cart,
        setMenuItems,
        addToCart,
        removeFromCart,
        clearCart,
        subtotal,
        tax,
        grandTotal,
        itemCount,
        restaurantId,
        setRestaurantId,
        tableNumber,
        setTableNumber,
      }}
    >
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}
