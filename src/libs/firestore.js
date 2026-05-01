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
  writeBatch,
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
      const restRef = doc(db, "restaurants", restaurantId);
      const snap = await getDoc(restRef);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (e) {
      console.error("Error fetching restaurant data:", e);
      return null;
    }
  },
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
  async getActiveSessionForTable(restaurantId, tableNumber) {
    if (!restaurantId || !tableNumber) return null;
    try {
      const sessionsCol = collection(db, `restaurants/${restaurantId}/sessions`);
      const q = query(
        sessionsCol,
        where("tableNumber", "==", tableNumber),
        where("isActive", "==", true),
        where("status", "==", "OPEN")
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const doc = snap.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (e) {
      console.error("Error fetching active session:", e);
      return null;
    }
  },

  async createWaiterCall(restaurantId, tableNumber, sessionId) {
    if (!restaurantId || !tableNumber || !sessionId) return;
    try {
      const notificationsCol = collection(db, `restaurants/${restaurantId}/notifications`);
      await addDoc(notificationsCol, {
        type: "WAITER_CALL",
        tableNumber,
        sessionId,
        status: "pending",
        createdAt: serverTimestamp()
      });
    } catch(e) {
      console.error("Error creating waiter call:", e);
    }
  },

  async placeOrder(restaurantId, sessionId, sessionMeta, orderData) {
    if (!restaurantId || !sessionId)
      throw new Error("restaurantId and sessionId are required");

    const sessionRef = doc(
      db,
      `restaurants/${restaurantId}/sessions/${sessionId}`,
    );
    const sessionSnap = await getDoc(sessionRef);

    // Determine current order round number
    const ordersCol = collection(
      db,
      `restaurants/${restaurantId}/sessions/${sessionId}/orders`,
    );
    const ordersSnap = await getDocs(ordersCol);
    const roundNumber = ordersSnap.size + 1;

    let participants = [];

    if (!sessionSnap.exists()) {
      // First order of this session — create the session document
      participants = [{ name: sessionMeta.customerName, orders: [] }];
      await setDoc(sessionRef, {
        restaurantId,
        tableNumber: sessionMeta.tableNumber,
        otp: sessionMeta.otp,
        customerName: sessionMeta.customerName,
        customerPhone: sessionMeta.customerPhone,
        numberOfPeople: sessionMeta.numberOfPeople || "1",
        participants: participants,
        status: "OPEN",
        /**
         * verified flag — PER TABLE VERIFICATION
         * When the waiter confirms the table/OTP, this will be set to true.
         * Once true, any subsequent orders in this session will be automatically verified.
         */
        verified: false, // Changed from true to false to enable verification flow
        isActive: true,
        createdAt: serverTimestamp(),
      });
    } else {
      const data = sessionSnap.data();
      participants = data.participants || [];
    }

    const sessionData = sessionSnap.exists()
      ? sessionSnap.data()
      : { verified: false };
    const isVerified = sessionData.verified || false;

    // Append a new order to the orders sub-collection
    const orderRef = await addDoc(ordersCol, {
      ...orderData,
      status: isVerified ? "OPEN" : "pending_verification",
      verified: isVerified,
      orderedBy: sessionMeta.customerName,
      roundNumber: roundNumber,
      createdAt: serverTimestamp(),
    });

    // Update participants array with the newly created order ID
    const participantIndex = participants.findIndex(p => p.name === sessionMeta.customerName);
    if (participantIndex >= 0) {
      participants[participantIndex].orders.push(orderRef.id);
    } else {
      participants.push({ name: sessionMeta.customerName, orders: [orderRef.id] });
    }

    // Always update the participants string in session to maintain mapping
    await updateDoc(sessionRef, { participants });

    // Also sync to the global orders collection for the admin POS to see
    const globalOrdersCol = collection(
      db,
      `restaurants/${restaurantId}/orders`,
    );
    await addDoc(globalOrdersCol, {
      ...orderData,
      tableNumber: sessionMeta.tableNumber,
      sessionId: sessionId,
      otp: sessionMeta.otp,
      customerName: sessionMeta.customerName,
      customerPhone: sessionMeta.customerPhone || sessionData.customerPhone || "",
      status: isVerified ? "new" : "pending_verification",
      verified: isVerified,
      orderedBy: sessionMeta.customerName,
      roundNumber: roundNumber,
      createdAt: serverTimestamp(),
      source: "client",
    });

    // Update table status to occupied (fails gracefully if permissions are missing)
    try {
      const tablesCol = collection(db, `restaurants/${restaurantId}/tables`);
      const q = query(tablesCol, where("name", "==", sessionMeta.tableNumber));
      const tableSnap = await getDocs(q);
      if (!tableSnap.empty) {
        const tableDoc = tableSnap.docs[0];
        await updateDoc(tableDoc.ref, { status: "occupied" });
      }
    } catch (e) {
      console.warn(
        "Could not update table status directly. The POS will still detect occupancy from the new order.",
      );
    }

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

  async requestPayment(restaurantId, sessionId, tableNumber) {
    if (!restaurantId || !sessionId)
      throw new Error("restaurantId and sessionId are required");

    const sessionRef = doc(
      db,
      `restaurants/${restaurantId}/sessions/${sessionId}`,
    );
    await updateDoc(sessionRef, {
      status: "PAYMENT_PENDING",
      updatedAt: serverTimestamp(),
    });

    const globalOrdersCol = collection(
      db,
      `restaurants/${restaurantId}/orders`,
    );
    const qOrders = query(
      globalOrdersCol,
      where("sessionId", "==", sessionId),
    );
    const orderSnap = await getDocs(qOrders);

    if (!orderSnap.empty) {
      const batch = writeBatch(db);
      orderSnap.docs.forEach((doc) => {
        const s = doc.data().status;
        if (s !== "completed" && s !== "PAYMENT_PENDING") {
          batch.update(doc.ref, { status: "PAYMENT_PENDING" });
        }
      });
      await batch.commit();
    }

    // Also update the table document to signal the admin POS directly (fails gracefully)
    try {
      const tablesCol = collection(db, `restaurants/${restaurantId}/tables`);
      const qTable = query(tablesCol, where("name", "==", tableNumber));
      const tableSnap = await getDocs(qTable);
      if (!tableSnap.empty) {
        const tableDoc = tableSnap.docs[0];
        await updateDoc(tableDoc.ref, {
          paymentStatus: "pending",
        });
      }
    } catch (e) {
      console.warn(
        "Could not update table payment status directly. The POS will still detect bill request from the order status.",
      );
    }

    // Create a notification for waiter/POS apps so they get a real-time toast
    try {
      const notificationsCol = collection(db, `restaurants/${restaurantId}/notifications`);
      await addDoc(notificationsCol, {
        type: "BILL_REQUEST",
        tableNumber,
        sessionId,
        status: "pending",
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Could not create bill request notification:", e);
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

// ─── Addons ───────────────────────────────────────────────────────────────────
export const addonsService = {
  async getAllAddons(restaurantId) {
    if (!restaurantId) return [];
    try {
      const q = query(tenantCol(restaurantId, "addons"), orderBy("name", "asc"));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error("Error fetching addons:", e);
      return [];
    }
  },
};

// ─── Offers ───────────────────────────────────────────────────────────────────
export const offersService = {
  async getAllOffers(restaurantId) {
    if (!restaurantId) return [];
    try {
      const q = query(tenantCol(restaurantId, "offers"), orderBy("name", "asc"));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error("Error fetching offers:", e);
      return [];
    }
  },
};

// ─── Adjustments ──────────────────────────────────────────────────────────────
export const adjustmentsService = {
  async getAllAdjustments(restaurantId) {
    if (!restaurantId) return [];
    try {
      const q = query(tenantCol(restaurantId, "adjustments"), orderBy("name", "asc"));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error("Error fetching adjustments:", e);
      return [];
    }
  },
};
