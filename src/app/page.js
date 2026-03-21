"use client";

import CartModal from "@/components/CartModal";
import Loader from "@/components/Loader";
import MenuCard from "@/components/MenuCard";
import PayBillModal from "@/components/PayBillModal";
import ViewOrderModal from "@/components/ViewOrderModal";
import { useCart } from "@/context/CartContext";
import { categoriesService, menuService, tablesService, restaurantService } from "@/libs/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// ─── Inner page (reads URL search params) ─────────────────────────────────────
function LandingPage() {
  return (
    <div className="max-w-md mx-auto min-h-svh relative bg-[#fffdfa] bg-food-pattern bg-repeat overflow-hidden">
      {/* Background fade */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/10 via-white/60 to-white via-[20vh] to-[65vh] z-0" />

      <div className="relative z-10 flex flex-col min-h-svh px-6">
        {/* Header — same as menu page */}
        <div className="pt-8 pb-4">
          <h1 className="text-3xl font-black italic tracking-tighter text-gray-900 leading-none">
            la
            <br />
            nena
          </h1>
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 pb-16">
          {/* Big brand mark */}
          <div className="w-20 h-20 rounded-3xl bg-[#059669] flex items-center justify-center shadow-lg shadow-emerald-200">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
              <path d="M7 2v20" />
              <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
            </svg>
          </div>

          <div>
            <h2 className="text-[28px] font-black text-gray-900 tracking-tight leading-tight">
              Order smarter.
              <br />
              Enjoy faster.
            </h2>
            <p className="text-[14px] text-gray-500 mt-3 leading-relaxed max-w-[260px] mx-auto">
              Scan the QR code at your table to browse the menu and place your
              order instantly.
            </p>
          </div>

          {/* Steps */}
          <div className="w-full mt-2 space-y-3">
            {[
              {
                icon: "📷",
                step: "Scan",
                desc: "Point your camera at the table QR",
              },
              {
                icon: "🍽️",
                step: "Browse",
                desc: "Explore the full menu & prices",
              },
              {
                icon: "✅",
                step: "Order",
                desc: "Confirm and your food is on its way",
              },
            ].map(({ icon, step, desc }) => (
              <div
                key={step}
                className="flex items-center gap-4 bg-white/70 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-sm border border-gray-100"
              >
                <span className="text-2xl w-9 text-center shrink-0">
                  {icon}
                </span>
                <div className="text-left">
                  <p className="text-[13px] font-bold text-gray-800">{step}</p>
                  <p className="text-[12px] text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pb-10 text-center">
          <p className="text-[11px] text-gray-400 font-medium">
            Powered by <span className="text-[#059669] font-bold">Relish</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function MenuPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = searchParams.get("restaurantId");
  const rawTable = searchParams.get("tableno");

  const { setMenuItems, setRestaurantId, setTableNumber, initSession } =
    useCart();

  // Derive the initial status from URL params — avoids calling setState inside an effect
  const [status, setStatus] = useState(() =>
    rawId && rawTable ? "loading" : "landing",
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [categories, setCategories] = useState([]);
  const [restaurantData, setRestaurantData] = useState(null);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    if (!rawId || !rawTable) return;

    setRestaurantId(rawId);
    setTableNumber(rawTable);
    initSession();

    const load = async () => {
      try {
        const [cats, items, isTableValid, rData] = await Promise.all([
          categoriesService.getAllCategories(rawId),
          menuService.getAllMenuItems(rawId),
          tablesService.validateTable(rawId, rawTable),
          restaurantService.getRestaurantData(rawId),
        ]);

        if (!isTableValid) {
          setErrorMsg(
            "Invalid Table Number. Please scan the QR code on your table again.",
          );
          setStatus("error");
          return;
        }

        if (items.length === 0 && cats.length === 0) {
          setErrorMsg(
            "Invalid Restaurant ID or no menu found. Please contact staff.",
          );
          setStatus("error");
          return;
        }

        setCategories(cats);
        setMenuItems(items);
        setRestaurantData(rData);
        setStatus("ready");
      } catch (e) {
        console.error(e);
        setErrorMsg("Could not load menu. Please check your connection.");
        setStatus("error");
      }
    };

    load();
  }, [
    rawId,
    rawTable,
    setMenuItems,
    setRestaurantId,
    setTableNumber,
    initSession,
  ]);

  if (status === "landing") return <LandingPage />;

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
      <div className="max-w-md mx-auto min-h-svh relative pb-28 bg-[#fffdfa] bg-food-pattern bg-repeat flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/0 via-white/30 to-white/80 z-0" />
        <div className="relative z-10 bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-gray-100 flex flex-col items-center w-full max-w-xs">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">😕</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Oops!</h1>
          <p className="text-[13px] text-gray-600 mb-8 leading-relaxed font-medium">
            {errorMsg}
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-[#059669] text-white font-semibold text-[15px] py-3.5 rounded-xl active:scale-95 transition-transform"
          >
            Go to Home
          </button>
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
      restaurantData={restaurantData}
    />
  );
}

function MenuContent({
  categories,
  activeCategory,
  setActiveCategory,
  cartOpen,
  setCartOpen,
  restaurantData,
}) {
  const { cart, itemCount, grandTotal, placedOrders, otp, tableNumber } =
    useCart();
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
  const placedTotal = placedOrders.reduce(
    (acc, o) => acc + (o.grandTotal || 0),
    0,
  );

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
              {restaurantData?.logo ? (
                <img src={restaurantData.logo} alt={restaurantData?.name || "Restaurant Logo"} className="h-[42px] object-contain max-w-[150px]" />
              ) : (
                <h1 className="text-3xl font-black italic tracking-tighter text-gray-900 leading-none">
                  {restaurantData?.name ? (
                    <>{restaurantData.name.split(" ")[0]}<br />{restaurantData.name.split(" ").slice(1).join(" ")}</>
                  ) : (
                    <>la<br />nena</>
                  )}
                </h1>
              )}
            </div>

            {/* Table + Session Info */}
            <div className="text-right text-xs text-gray-800 font-medium">
              <p>
                Table No.{" "}
                <span className="font-bold text-sm">{tableNumber ?? "—"}</span>
              </p>
              <p>
                Sesh. <span className="font-bold text-sm">{otp ?? "—"}</span>
              </p>
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
                <svg
                  width="12"
                  height="8"
                  viewBox="0 0 12 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.59 0.589966L6 5.16997L1.41 0.589966L0 1.99997L6 7.99997L12 1.99997L10.59 0.589966Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>

            {/* Veg Only Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-gray-700">
                Veg only
              </span>
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
            <span className="text-xs font-semibold text-gray-500 mb-0.5">
              Total
            </span>
            <span className="text-base font-bold text-gray-900 tracking-tight">
              ₹{" "}
              {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </span>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="bg-[#059669] text-white font-semibold text-sm rounded-[10px] px-5 py-2.5 flex items-center gap-2 active:scale-95 transition-transform"
          >
            View Order
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      )}

      {/* State 2 – new items added on top of existing order */}
      {hasNewItems && hasPreviousOrders && (
        <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white border-t border-gray-100 px-5 py-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 mb-0.5">
              New items
            </span>
            <span className="text-base font-bold text-gray-900 tracking-tight">
              ₹{" "}
              {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
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
      {viewOrderOpen && (
        <ViewOrderModal onClose={() => setViewOrderOpen(false)} />
      )}
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
