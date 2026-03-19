'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';

const CartCtx = createContext(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function generateOTP() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const LS_KEY = 'relish_session';

function loadSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(data) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {}
}

function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LS_KEY);
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function CartProvider({ children }) {
  // cart holds ALL menu items each with quantity:0 initially
  const [cart, setCart] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [tableNumber, setTableNumber] = useState(null);

  // Session identity — persisted in localStorage
  const [sessionId, setSessionId] = useState(null);
  const [otp, setOtp] = useState(null);

  // Orders already submitted to Firestore in this session
  const [placedOrders, setPlacedOrders] = useState([]);

  // Customer info captured once per session
  const [customerInfo, setCustomerInfo] = useState(null);

  // ── Restore session from localStorage on first mount ──────────────────────
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      if (saved.sessionId) setSessionId(saved.sessionId);
      if (saved.otp) setOtp(saved.otp);
      if (saved.placedOrders) setPlacedOrders(saved.placedOrders);
      if (saved.customerInfo) setCustomerInfo(saved.customerInfo);
    }
  }, []);

  // ── Persist session data whenever it changes ───────────────────────────────
  useEffect(() => {
    if (!sessionId && !otp) return; // nothing to save yet
    saveSession({ sessionId, otp, placedOrders, customerInfo });
  }, [sessionId, otp, placedOrders, customerInfo]);

  // ── Initialise or reuse session identity when restaurant is set ───────────
  const initSession = useCallback(() => {
    const saved = loadSession();
    if (saved?.sessionId && saved?.otp) {
      setSessionId(saved.sessionId);
      setOtp(saved.otp);
    } else {
      const newId = generateUUID();
      const newOtp = generateOTP();
      setSessionId(newId);
      setOtp(newOtp);
    }
  }, []);

  /**
   * Load menu items into the cart (quantity starts at 0).
   */
  const setMenuItems = useCallback((items) => {
    setCart(items.map((item) => ({ ...item, quantity: 0 })));
  }, []);

  const addToCart = useCallback((item) => {
    setCart((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
    );
  }, []);

  const removeFromCart = useCallback((item) => {
    setCart((prev) =>
      prev.map((i) =>
        i.id === item.id && i.quantity > 0 ? { ...i, quantity: i.quantity - 1 } : i
      )
    );
  }, []);

  /** Reset quantities to 0 (after an order batch is submitted) */
  const clearCart = useCallback(() => {
    setCart((prev) => prev.map((i) => ({ ...i, quantity: 0 })));
  }, []);

  /**
   * Add a submitted order batch to the session's placed orders list.
   * @param {object} order – the order object that was stored in Firestore
   */
  const addPlacedOrder = useCallback((order) => {
    setPlacedOrders((prev) => {
      const updated = [...prev, order];
      return updated;
    });
  }, []);

  /**
   * Fully clear session (after Pay Bill).
   */
  const endSession = useCallback(() => {
    clearCart();
    setPlacedOrders([]);
    setCustomerInfo(null);
    setSessionId(null);
    setOtp(null);
    clearSession();
  }, [clearCart]);

  // ── Computed totals (current cart only) ───────────────────────────────────
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
        // cart
        cart,
        setMenuItems,
        addToCart,
        removeFromCart,
        clearCart,
        subtotal,
        tax,
        grandTotal,
        itemCount,
        // restaurant
        restaurantId,
        setRestaurantId,
        tableNumber,
        setTableNumber,
        // session
        sessionId,
        otp,
        initSession,
        // placed orders
        placedOrders,
        addPlacedOrder,
        // customer
        customerInfo,
        setCustomerInfo,
        // end
        endSession,
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
