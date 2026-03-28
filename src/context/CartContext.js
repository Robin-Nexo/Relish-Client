"use client";

import { db } from "@/libs/firebase";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
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
  } catch { }
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

  // Track if this device joined an existing session
  const [joinedSession, setJoinedSession] = useState(false);

  // ── Restore session from localStorage on first mount ──────────────────────
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  useEffect(() => {
    const saved = loadSession();
    // Defer all setState calls so we don't trip strict eslint rules.
    const t = setTimeout(() => {
      if (saved) {
        if (saved.sessionId) setSessionId(saved.sessionId);
        if (saved.otp) setOtp(saved.otp);
        // Don't restore placedOrders from localStorage - let Firestore realtime listener handle it
        if (saved.customerInfo) setCustomerInfo(saved.customerInfo);
        if (saved.joinedSession !== undefined)
          setJoinedSession(saved.joinedSession);
      }
      setIsSessionLoaded(true);
    }, 0);

    return () => clearTimeout(t);
  }, []);

  // ── Persist session data whenever it changes ───────────────────────────────
  useEffect(() => {
    if (!sessionId && !otp) return; // nothing to save yet
    // Don't persist placedOrders - let Firestore realtime listener be the source of truth
    saveSession({ sessionId, otp, customerInfo, joinedSession });
  }, [sessionId, otp, customerInfo, joinedSession]);

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

  const joinExistingSession = useCallback((newSessionId, newOtp) => {
    setSessionId(newSessionId);
    setOtp(newOtp);
    setPlacedOrders([]);
    setJoinedSession(true);
    // Remove previous customer info since it's a new device joining
    setCustomerInfo(null);
  }, []);

  /**
   * Load menu items from DB.
   */
  const setMenuItems = useCallback((items) => {
    setMenuItemsRaw(items);
    setCart([]);
  }, []);

  const addToCart = useCallback((item, variantInfo = null, qtyStr = 1, selectedAddons = [], finalBasePrice = null) => {
    const qty = parseInt(qtyStr, 10);
    setCart((prev) => {
      const addonStr = selectedAddons.map(a => a.id).sort().join(',');
      const variantStr = variantInfo ? variantInfo.name : 'base';
      const cartItemId = `${item.id}-${variantStr}-${addonStr}`;

      const existing = prev.find(i => i.cartItemId === cartItemId);
      if (existing) {
        return prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + qty } : i);
      } else {
        const base = finalBasePrice !== null ? finalBasePrice : (variantInfo ? variantInfo.price : (item._discountedPrice ?? item.price));
        return [...prev, {
          ...item,
          cartItemId,
          variantName: variantInfo?.name || null,
          price: base,
          selectedAddons,
          name: variantInfo ? `${item.name} (${variantInfo.name})` : item.name,
          baseName: item.name,
          quantity: qty
        }];
      }
    });
  }, []);

  const removeFromCart = useCallback((item, variantInfo = null, qtyStr = 1, selectedAddons = []) => {
    const qty = parseInt(qtyStr, 10);
    setCart((prev) => {
      const addonStr = selectedAddons.map(a => a.id).sort().join(',');
      const variantStr = variantInfo ? variantInfo.name : 'base';
      const cartItemId = `${item.id}-${variantStr}-${addonStr}`;

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

  // ── Realtime orders for this session (combined across devices) ─────────
  useEffect(() => {
    if (!restaurantId || !sessionId) return;

    const ordersRef = collection(
      db,
      `restaurants/${restaurantId}/sessions/${sessionId}/orders`,
    );
    // Order by roundNumber so "Order 1, 2, 3..." matches across devices.
    const ordersQ = query(ordersRef, orderBy("roundNumber", "asc"));

    const unsubscribe = onSnapshot(ordersQ, (snap) => {
      const orders = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setPlacedOrders(
        orders.map((o) => ({
          id: o.id,
          items: Array.isArray(o.items) ? o.items : [],
          subtotal: Number(o.subtotal || 0),
          tax: Number(o.tax || 0),
          grandTotal: Number(o.grandTotal || 0),
          orderedBy: o.orderedBy || "Table",
          roundNumber:
            typeof o.roundNumber === "number"
              ? o.roundNumber
              : Number(o.roundNumber || 0) || undefined,
        })),
      );
    });

    return () => unsubscribe();
  }, [restaurantId, sessionId]);

  // ── Computed totals (current cart only) ───────────────────────────────────
  const subtotal = cart.reduce(
    (acc, i) => {
      const addonsSum = (i.selectedAddons || []).reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);
      const unitTotal = parseFloat(i.price || 0) + addonsSum;
      return acc + (i.quantity > 0 ? unitTotal * i.quantity : 0);
    },
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
        joinExistingSession,
        joinedSession,
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
