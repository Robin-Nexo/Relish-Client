"use client";

import CartModal from "@/components/CartModal";
import Loader from "@/components/Loader";
import MenuCard from "@/components/MenuCard";
import PayBillModal from "@/components/PayBillModal";
import ViewOrderModal from "@/components/ViewOrderModal";
import { useCart } from "@/context/CartContext";
import { categoriesService, menuService } from "@/libs/firestore";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// ─── Inner page (reads URL search params) ─────────────────────────────────────
function MenuPage() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get("restaurantId");
  const rawTable = searchParams.get("tableno");

  const { setMenuItems, setRestaurantId, setTableNumber, initSession } = useCart();

  const [status, setStatus] = useState("loading"); // 'loading' | 'ready' | 'error'
  const [errorMsg, setErrorMsg] = useState("");
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    if (!rawId || !rawTable) {
      setStatus("error");
      setErrorMsg("Invalid QR code. Please scan a valid Relish QR.");
      return;
    }

    setRestaurantId(rawId);
    setTableNumber(rawTable);
    initSession(); // generate or restore sessionId + OTP

    const load = async () => {
      try {
        const [cats, items] = await Promise.all([
          categoriesService.getAllCategories(rawId),
          menuService.getAllMenuItems(rawId),
        ]);

        if (items.length === 0 && cats.length === 0) {
          setErrorMsg("No menu found for this restaurant. Please contact staff.");
          setStatus("error");
          return;
        }

        setCategories(cats);
        setMenuItems(items);
        setStatus("ready");
      } catch (e) {
        console.error(e);
        setErrorMsg("Could not load menu. Please check your connection.");
        setStatus("error");
      }
    };

    load();
  }, [rawId, rawTable, setMenuItems, setRestaurantId, setTableNumber, initSession]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh gap-4">
        <Loader size="lg" />
        <p className="text-sm text-gray-500">Loading menu…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="max-w-md mx-auto min-h-svh relative pb-28 bg-[#fffdfa] bg-food-pattern bg-repeat">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/0 via-white/30 to-white/80 z-0" />
        <div className="relative flex flex-col items-center justify-center min-h-svh px-8 text-center z-10">
          <span className="text-5xl mb-4">😕</span>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Oops!</h1>
          <p className="text-sm text-gray-500">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <MenuContent
      categories={categories}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      cartOpen={cartOpen}
      setCartOpen={setCartOpen}
    />
  );
}

function MenuContent({
  categories,
  activeCategory,
  setActiveCategory,
  cartOpen,
  setCartOpen,
}) {
  const { cart, itemCount, grandTotal, placedOrders, otp, tableNumber } = useCart();
  const [vegOnly, setVegOnly] = useState(false);
  const [viewOrderOpen, setViewOrderOpen] = useState(false);
  const [payBillOpen, setPayBillOpen] = useState(false);

  // Filter logic
  let filteredItems =
    activeCategory === "ALL"
      ? cart
      : cart.filter((i) => i.category === activeCategory);

  if (vegOnly) {
    filteredItems = filteredItems.filter((i) => i.isVeg);
  }

  const hasNewItems = itemCount > 0;
  const hasPreviousOrders = placedOrders.length > 0;

  // Running total across all placed orders
  const placedTotal = placedOrders.reduce((acc, o) => acc + (o.grandTotal || 0), 0);

  return (
    <div className="max-w-md mx-auto min-h-svh relative pb-28 bg-[#fffdfa] bg-food-pattern bg-repeat">
      {/* Global Background Fade */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/20 via-white/50 to-white via-[25vh] to-[80vh] z-0" />

      {/* Main Content wrapper */}
      <div className="relative z-10">
        {/* Top Header Section */}
        <div className="px-5 pt-8 pb-4">
          <div className="flex items-start justify-between">
            {/* Logo */}
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter text-gray-900 leading-none">
                la
                <br />
                nena
              </h1>
            </div>

            {/* Table + Session Info */}
            <div className="text-right text-xs text-gray-800 font-medium">
              <p>Table No. <span className="font-bold text-sm">{tableNumber ?? "—"}</span></p>
              <p>Sesh. <span className="font-bold text-sm">{otp ?? "—"}</span></p>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex items-center justify-between mt-6 gap-4">
            {/* Category Dropdown */}
            <div className="relative flex-1">
              <select
                className="w-full appearance-none bg-white border border-[#059669] text-[#059669] font-bold text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#059669]/20"
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#059669]">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.59 0.589966L6 5.16997L1.41 0.589966L0 1.99997L6 7.99997L12 1.99997L10.59 0.589966Z" fill="currentColor" />
                </svg>
              </div>
            </div>

            {/* Veg Only Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-gray-700">Veg only</span>
              <button
                type="button"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${vegOnly ? "bg-[#059669]" : "bg-gray-200"}`}
                onClick={() => setVegOnly(!vegOnly)}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${vegOnly ? "translate-x-5 shadow-sm" : "translate-x-0.5 shadow-sm border border-gray-300"}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Title & Selected count */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-black">
          Select one or more dishes{itemCount === 0 && " to order"}
        </h2>
      </div>

      {/* Menu grid */}
      <div className="px-5 pt-2">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <span className="text-4xl mb-3">🍽️</span>
            <p className="text-sm">No items match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* ── Dynamic Bottom Action Bar ─────────────────────────────────────────
          State 1: hasNewItems && !hasPreviousOrders → standard cart summary
          State 2: hasNewItems && hasPreviousOrders  → "Add To My Order →"
          State 3: !hasNewItems && hasPreviousOrders → "View My Order" + "Pay Bill →"
          State 4: nothing                           → hidden
      ──────────────────────────────────────────────────────────────────────── */}

      {/* State 1 – fresh cart, no prior orders */}
      {hasNewItems && !hasPreviousOrders && (
        <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white border-t border-gray-100 px-5 py-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 mb-0.5">Total</span>
            <span className="text-base font-bold text-gray-900 tracking-tight">
              ₹ {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </span>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="bg-[#059669] text-white font-semibold text-sm rounded-[10px] px-5 py-2.5 flex items-center gap-2 active:scale-95 transition-transform"
          >
            View Order
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      )}

      {/* State 2 – new items added on top of existing order */}
      {hasNewItems && hasPreviousOrders && (
        <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white border-t border-gray-100 px-5 py-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 mb-0.5">New items</span>
            <span className="text-base font-bold text-gray-900 tracking-tight">
              ₹ {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </span>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="bg-[#059669] text-white font-semibold text-sm rounded-[10px] px-5 py-2.5 flex items-center gap-2 active:scale-95 transition-transform"
          >
            Add To My Order →
          </button>
        </div>
      )}

      {/* State 3 – no new items, but has placed orders */}
      {!hasNewItems && hasPreviousOrders && (
        <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white border-t border-gray-100 px-5 py-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] flex items-center justify-between gap-3">
          <button
            onClick={() => setViewOrderOpen(true)}
            className="flex-1 border border-[#059669] text-[#059669] font-semibold text-sm rounded-[10px] px-4 py-2.5 active:scale-95 transition-transform"
          >
            View My Order
          </button>
          <button
            onClick={() => setPayBillOpen(true)}
            className="flex-1 bg-[#059669] text-white font-semibold text-sm rounded-[10px] px-4 py-2.5 flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            Pay Bill →
          </button>
        </div>
      )}

      {/* Modals */}
      {cartOpen && <CartModal onClose={() => setCartOpen(false)} />}
      {viewOrderOpen && <ViewOrderModal onClose={() => setViewOrderOpen(false)} />}
      {payBillOpen && <PayBillModal onClose={() => setPayBillOpen(false)} />}
    </div>
  );
}

// ─── Default export wrapped in Suspense (required for useSearchParams) ─────────
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-svh">
          <Loader size="lg" />
        </div>
      }
    >
      <MenuPage />
    </Suspense>
  );
}
