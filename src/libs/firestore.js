import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Multi-tenant helpers ──────────────────────────────────────────────────────
const tenantCol = (restaurantId, path) =>
  collection(db, `restaurants/${restaurantId}/${path}`);

const tenantDoc = (restaurantId, ...segments) =>
  doc(db, `restaurants/${restaurantId}`, ...segments);

// ─── Restaurant ───────────────────────────────────────────────────────────────
export const restaurantService = {
  async getRestaurantData(restaurantId) {
    if (!restaurantId) return null;
    try {
      const restRef = doc(db, 'restaurants', restaurantId);
      const snap = await getDoc(restRef);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (e) {
      console.error("Error fetching restaurant data:", e);
      return null;
    }
  }
};

// ─── Tables ───────────────────────────────────────────────────────────────────
export const tablesService = {
  async validateTable(restaurantId, tableNumber) {
    if (!restaurantId || !tableNumber) return false;
    try {
      const q = query(
        tenantCol(restaurantId, "tables"),
        where("name", "==", tableNumber),
      );
      const snap = await getDocs(q);
      if (!snap.empty) return true;

      // also try matching by name or number (numeric vs string)
      const q2 = query(
        tenantCol(restaurantId, "tables"),
        where("no", "==", String(tableNumber)),
      );
      const snap2 = await getDocs(q2);
      return !snap2.empty;
    } catch (e) {
      console.error("Error validating table:", e);
      return false;
    }
  },
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoriesService = {
  /**
   * Fetch all menu categories for a restaurant.
   * @param {string} restaurantId
   * @returns {Promise<Array<{id:string, name:string}>>}
   */
  async getAllCategories(restaurantId) {
    if (!restaurantId) return [];
    try {
      const q = query(
        tenantCol(restaurantId, "categories"),
        orderBy("name", "asc"),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error("Error fetching categories:", e);
      return [];
    }
  },
};

// ─── Menu Items ───────────────────────────────────────────────────────────────
export const menuService = {
  async getAllMenuItems(restaurantId) {
    if (!restaurantId) return [];
    try {
      const q = query(
        tenantCol(restaurantId, "menuItems"),
        orderBy("name", "asc"),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error("Error fetching menu items:", e);
      return [];
    }
  },
};

// ─── Sessions ────────────────────────────────────────────────────────────────
/**
 * Session Document schema:
 *   restaurants/{restaurantId}/sessions/{sessionId}
 *   {
 *     restaurantId, tableNumber, otp, status: 'OPEN' | 'CLOSED',
 *     isActive: true | false,   ← future-feature hook: allows a friend to search
 *                                   for this session by OTP to join it
 *     customerName, customerPhone, createdAt, closedAt?
 *   }
 *
 * Order Sub-collection:
 *   restaurants/{restaurantId}/sessions/{sessionId}/orders/{orderId}
 *   { items, subtotal, tax, grandTotal, createdAt }
 */
export const sessionService = {
  async placeOrder(restaurantId, sessionId, sessionMeta, orderData) {
    if (!restaurantId || !sessionId)
      throw new Error("restaurantId and sessionId are required");

    const sessionRef = doc(
      db,
      `restaurants/${restaurantId}/sessions/${sessionId}`,
    );
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      // First order of this session — create the session document
      await setDoc(sessionRef, {
        restaurantId,
        tableNumber: sessionMeta.tableNumber,
        otp: sessionMeta.otp,
        customerName: sessionMeta.customerName,
        customerPhone: sessionMeta.customerPhone,
        status: "OPEN",
        /**
         * isActive flag — FUTURE FEATURE HOOK
         * When a friend wants to join the same session in the future,
         * they will enter the OTP manually. The app will query:
         *   sessions where otp == enteredOtp AND isActive == true AND restaurantId == X
         * and link them to this session directly.
         * For now this is simply set to true and flipped to false on paySessionBill().
         */
        isActive: true,
        createdAt: serverTimestamp(),
      });
    }

    // Append a new order to the orders sub-collection
    const ordersCol = collection(
      db,
      `restaurants/${restaurantId}/sessions/${sessionId}/orders`,
    );
    const orderRef = await addDoc(ordersCol, {
      ...orderData,
      status: "OPEN",
      createdAt: serverTimestamp(),
    });

    return orderRef.id;
  },

  /**
   * Fetch all orders placed in a session.
   * @param {string} restaurantId
   * @param {string} sessionId
   * @returns {Promise<Array>}
   */
  async getSessionOrders(restaurantId, sessionId) {
    if (!restaurantId || !sessionId) return [];
    try {
      const ordersCol = collection(
        db,
        `restaurants/${restaurantId}/sessions/${sessionId}/orders`,
      );
      const q = query(ordersCol, orderBy("createdAt", "asc"));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error("Error fetching session orders:", e);
      return [];
    }
  },

  async paySessionBill(restaurantId, sessionId) {
    if (!restaurantId || !sessionId)
      throw new Error("restaurantId and sessionId are required");
    const sessionRef = doc(
      db,
      `restaurants/${restaurantId}/sessions/${sessionId}`,
    );
    await updateDoc(sessionRef, {
      status: "CLOSED",
      isActive: false, // marks session as no longer joinable
      closedAt: serverTimestamp(),
    });
  },
};

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const reviewsService = {
  async addReview(restaurantId, data) {
    if (!restaurantId) throw new Error("restaurantId is required");
    await addDoc(tenantCol(restaurantId, "reviews"), {
      ...data,
      createdAt: serverTimestamp(),
    });
  },
};
