import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

// ─── Multi-tenant helpers ──────────────────────────────────────────────────────
const tenantCol = (restaurantId, path) =>
  collection(db, `restaurants/${restaurantId}/${path}`);

// ─── Tables ───────────────────────────────────────────────────────────────────
export const tablesService = {
  /**
   * Checks whether a table with the given number exists inside the restaurant.
   * @param {string} restaurantId
   * @param {string|number} tableNumber
   * @returns {Promise<boolean>}
   */
  async validateTable(restaurantId, tableNumber) {
    if (!restaurantId || !tableNumber) return false;
    try {
      const q = query(
        tenantCol(restaurantId, 'tables'),
        where('no', '==', tableNumber)
      );
      const snap = await getDocs(q);
      if (!snap.empty) return true;

      // also try matching by name or number (numeric vs string)
      const q2 = query(
        tenantCol(restaurantId, 'tables'),
        where('no', '==', String(tableNumber))
      );
      const snap2 = await getDocs(q2);
      return !snap2.empty;
    } catch (e) {
      console.error('Error validating table:', e);
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
      const q = query(tenantCol(restaurantId, 'categories'), orderBy('name', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error('Error fetching categories:', e);
      return [];
    }
  },
};

// ─── Menu Items ───────────────────────────────────────────────────────────────
export const menuService = {
  /**
   * Fetch all menu items for a restaurant.
   * @param {string} restaurantId
   * @returns {Promise<Array>}
   */
  async getAllMenuItems(restaurantId) {
    if (!restaurantId) return [];
    try {
      const q = query(tenantCol(restaurantId, 'menuItems'), orderBy('name', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error('Error fetching menu items:', e);
      return [];
    }
  },
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export const ordersService = {
  /**
   * Place a new order.
   * @param {string} restaurantId
   * @param {object} orderData
   * @returns {Promise<string>} The new order document ID
   */
  async placeOrder(restaurantId, orderData) {
    if (!restaurantId) throw new Error('restaurantId is required');
    const docRef = await addDoc(tenantCol(restaurantId, 'orders'), {
      ...orderData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },
};

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const reviewsService = {
  /**
   * Submit a customer review.
   * @param {string} restaurantId
   * @param {object} data  { name, review }
   */
  async addReview(restaurantId, data) {
    if (!restaurantId) throw new Error('restaurantId is required');
    await addDoc(tenantCol(restaurantId, 'reviews'), {
      ...data,
      createdAt: serverTimestamp(),
    });
  },
};
