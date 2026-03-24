"use client";

import { db } from "@/libs/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const CartCtx = createContext(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function generateOTP() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const LS_KEY = "relish_session";

function loadSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(data) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {}
}

function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LS_KEY);
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function CartProvider({ children }) {
  // Selected items in cart
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItemsRaw] = useState([]);
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
   * Load menu items from DB.
   */
  const setMenuItems = useCallback((items) => {
    setMenuItemsRaw(items);
    setCart([]);
  }, []);

  const addToCart = useCallback((item, variantInfo = null, qtyStr = 1) => {
    const qty = parseInt(qtyStr, 10);
    setCart((prev) => {
      const cartItemId = variantInfo ? `${item.id}-${variantInfo.name}` : item.id;
      const existing = prev.find(i => i.cartItemId === cartItemId);
      if (existing) {
        return prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + qty } : i);
      } else {
        return [...prev, { 
          ...item, 
          cartItemId, 
          variantName: variantInfo?.name || null,
          price: variantInfo ? variantInfo.price : item.price,
          name: variantInfo ? `${item.name} (${variantInfo.name})` : item.name,
          baseName: item.name,
          quantity: qty 
        }];
      }
    });
  }, []);

  const removeFromCart = useCallback((item, variantInfo = null, qtyStr = 1) => {
    const qty = parseInt(qtyStr, 10);
    setCart((prev) => {
      const cartItemId = variantInfo ? `${item.id}-${variantInfo.name}` : item.id;
      return prev.map(i => {
        if (i.cartItemId === cartItemId) {
          return { ...i, quantity: Math.max(0, i.quantity - qty) };
        }
        return i;
      }).filter(i => i.quantity > 0);
    });
  }, []);

  /** Reset cart */
  const clearCart = useCallback(() => {
    setCart([]);
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

  // ── Listen for session completion from admin POS ───────────────────────────
  useEffect(() => {
    if (!restaurantId || !sessionId) return;

    const sessionRef = doc(
      db,
      `restaurants/${restaurantId}/sessions/${sessionId}`,
    );
    const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === "CLOSED") {
          // Admin has completed the order
          endSession();
        }
      }
    });

    return () => unsubscribe();
  }, [restaurantId, sessionId, endSession]);

  // ── Computed totals (current cart only) ───────────────────────────────────
  const subtotal = cart.reduce(
    (acc, i) =>
      acc + (i.quantity > 0 ? parseFloat(i.price || 0) * i.quantity : 0),
    0,
  );
  const tax = parseFloat(((5 * subtotal) / 100).toFixed(2));
  const grandTotal = parseFloat((subtotal + tax).toFixed(2));
  const itemCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <CartCtx.Provider
      value={{
        // menu & cart
        menuItems,
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
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
