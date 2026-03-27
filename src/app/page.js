"use client";

import CartModal from "@/components/CartModal";
import Loader from "@/components/Loader";
import MenuCard from "@/components/MenuCard";
import PayBillModal from "@/components/PayBillModal";
import ProductModal from "@/components/ProductModal";
import ViewOrderModal from "@/components/ViewOrderModal";
import { useCart } from "@/context/CartContext";
import { calculateAdjustments } from "@/libs/adjustments";
import {
    addonsService,
    adjustmentsService,
    categoriesService,
    menuService,
    offersService,
    restaurantService,
    sessionService,
    tablesService,
} from "@/libs/firestore";
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

function JoinSessionPage({ existingSessionData, onJoin }) {
  const [otpInput, setOtpInput] = useState("");
  const [error, setError] = useState("");

  const handleJoin = () => {
    if (otpInput === String(existingSessionData.otp)) {
      onJoin(existingSessionData.id, existingSessionData.otp);
    } else {
      setError("Incorrect OTP. Please check with your table and try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-svh flex flex-col items-center justify-center bg-[#fffdfa] px-6 text-center">
      <div className="w-16 h-16 bg-[#059669]/10 rounded-full flex items-center justify-center mb-6">
        <span className="text-3xl">👋</span>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Table</h2>
      <p className="text-[14px] text-gray-500 mb-8 leading-relaxed max-w-[260px] mx-auto">
        An active session already exists for this table. Ask your table for the 4-digit OTP to join them.
      </p>

      <div className="w-full max-w-xs space-y-4">
        <input
          type="text"
          maxLength={4}
          placeholder="Enter 4-digit OTP"
          value={otpInput}
          onChange={(e) => {
            setOtpInput(e.target.value.replace(/\D/g, ""));
            setError("");
          }}
          className="w-full text-center text-2xl tracking-[0.5em] font-bold border border-gray-200 rounded-xl px-4 py-4 focus:outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669]"
        />
        {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

        <button
          onClick={handleJoin}
          disabled={otpInput.length !== 4}
          className="w-full bg-[#059669] text-white font-semibold text-[15px] py-3.5 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
        >
          Join Table
        </button>
      </div>
    </div>
  );
}

function MenuPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = searchParams.get("restaurantId");
  const rawTable = searchParams.get("tableno");

  const { setMenuItems, setRestaurantId, setTableNumber, initSession, joinExistingSession } =
    useCart();

  // Derive the initial status from URL params — avoids calling setState inside an effect
  const [status, setStatus] = useState(() =>
    rawId && rawTable ? "loading" : "landing",
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [existingSessionData, setExistingSessionData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [restaurantData, setRestaurantData] = useState(null);
  const [offersData, setOffersData] = useState([]);
  const [addonsData, setAddonsData] = useState([]);
  const [adjustmentsData, setAdjustmentsData] = useState([]);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    if (!rawId || !rawTable) return;

    setRestaurantId(rawId);
    setTableNumber(rawTable);

    const load = async () => {
      try {
        const [
          cats,
          items,
          isTableValid,
          rData,
          offers,
          allAddons,
          adjustments,
          activeSession,
        ] = await Promise.all([
          categoriesService.getAllCategories(rawId),
          menuService.getAllMenuItems(rawId),
          tablesService.validateTable(rawId, rawTable),
          restaurantService.getRestaurantData(rawId),
          offersService.getAllOffers(rawId),
          addonsService.getAllAddons(rawId),
          adjustmentsService.getAllAdjustments(rawId),
          sessionService.getActiveSessionForTable(rawId, rawTable),
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

        // --- Data Augmentation: Inject Offers and Linked Addons ---
        const activeOffers = (offers || []).filter(
          (o) => o.status === "active",
        );
        const activeAddons = (allAddons || []).filter(
          (a) => a.status === "active",
        );
        const addonMap = new Map(activeAddons.map((a) => [a.id, a]));

        let enrichedItems = items.map((item) => {
          // Resolve linked Addons
          const itemAddons = (item.addons || [])
            .map((id) => addonMap.get(id))
            .filter(Boolean);

          // Resolve matched Offer
          const matchingOffer = activeOffers.find((o) =>
            o.applicableItems?.includes(item.id),
          );
          let discountedPrice = item.price;

          if (matchingOffer) {
            if (matchingOffer.discountType === "percentage") {
              discountedPrice =
                item.price - item.price * (matchingOffer.discountValue / 100);
            } else if (matchingOffer.discountType === "fixed") {
              discountedPrice = Math.max(
                0,
                item.price - matchingOffer.discountValue,
              );
            }
          }

          return {
            ...item,
            _offer: matchingOffer || null,
            _discountedPrice: discountedPrice,
            _addonsConfig: itemAddons,
          };
        });

        // Bubble items with offers to the top
        enrichedItems.sort((a, b) => {
          if (a._offer && !b._offer) return -1;
          if (!a._offer && b._offer) return 1;
          return 0; // maintain relative order
        });

        let standaloneAddons = [];
        if (activeAddons.length > 0) {
          standaloneAddons = activeAddons.map((addon) => ({
            id: `addon-${addon.id}`,
            name: addon.name,
            price: addon.price,
            description: addon.description,
            category: "Add-ons",
            isVeg: addon.isVeg !== undefined ? addon.isVeg : true,
            status: "active",
            isStandaloneAddon: true,
            _parentAddonId: addon.id,
            _addonsConfig: [],
            _discountedPrice: addon.price,
            _offer: null,
          }));
        }

        setCategories(cats);
        setMenuItems(enrichedItems);
        setOffersData(activeOffers);
        setAddonsData(standaloneAddons);
        setAdjustmentsData(adjustments || []);
        setRestaurantData(rData);

        const localSeshRaw = localStorage.getItem("relish_session");
        const localSesh = localSeshRaw ? JSON.parse(localSeshRaw) : {};

        if (activeSession && localSesh?.sessionId !== activeSession.id) {
          setExistingSessionData(activeSession);
          setStatus("join_session");
        } else {
          initSession();
          setStatus("ready");
        }
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

  if (status === "join_session") {
    return (
      <JoinSessionPage
        existingSessionData={existingSessionData}
        onJoin={(id, otp) => {
          joinExistingSession(id, otp);
          setStatus("ready");
        }}
      />
    );
  }

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
          <h1 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
            Oops!
          </h1>
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
      offersData={offersData}
      addonsData={addonsData}
      adjustmentsData={adjustmentsData}
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
  offersData,
  addonsData,
  adjustmentsData,
}) {
  const {
    menuItems,
    cart,
    itemCount,
    grandTotal,
    placedOrders,
    otp,
    restaurantId,
    sessionId,
    tableNumber,
  } = useCart();
  const [vegOnly, setVegOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewOrderOpen, setViewOrderOpen] = useState(false);
  const [payBillOpen, setPayBillOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustments, setAdjustments] = useState(null);
  const [callingWaiter, setCallingWaiter] = useState(false);

  const handleCallWaiter = async () => {
    if (!restaurantId || !tableNumber || !sessionId) return;
    setCallingWaiter(true);
    try {
      await sessionService.createWaiterCall(restaurantId, tableNumber, sessionId);
      alert("Wait staff has been notified.");
    } catch (e) {
      console.error(e);
      alert("Failed to call waiter. Please try again.");
    } finally {
      setTimeout(() => setCallingWaiter(false), 5000);
    }
  };

  // Pre-filter valid offers that actually have menu items attached to prevent dead-space UI bugs
  const validOffers = (offersData || []).filter((offer) =>
    menuItems.some(
      (i) => i._offer && i._offer.id === offer.id && i.status !== "inactive" && (!vegOnly || i.isVeg === true || i.isVeg === "true"),
    ),
  );

  // Filter logic
  let filteredItems =
    activeCategory === "ALL"
      ? menuItems
      : activeCategory.startsWith("OFFER_")
        ? menuItems.filter(
            (i) =>
              i._offer && i._offer.id === activeCategory.replace("OFFER_", ""),
          )
        : menuItems.filter((i) => i.category === activeCategory);

  filteredItems = filteredItems.filter((i) => i.status !== "inactive");

  if (vegOnly) {
    filteredItems = filteredItems.filter(
      (i) => i.isVeg === true || i.isVeg === "true",
    );
  }

  let filteredAddons = addonsData || [];
  if (vegOnly) {
    filteredAddons = filteredAddons.filter(
      (a) => a.isVeg === true || a.isVeg === "true",
    );
  }

  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase().trim();
    
    // Filter main items by item name, offer name, or category
    filteredItems = filteredItems.filter((i) => {
      const matchName = i.name?.toLowerCase().includes(q);
      const matchOffer = i._offer?.name?.toLowerCase().includes(q);
      const matchCategory = i.category?.toLowerCase().includes(q);
      return matchName || matchOffer || matchCategory;
    });

    // Filter add-ons by name or category
    const matchAddons = filteredAddons.filter((a) =>
      a.name?.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q)
    );

    // Combine for unified Search Results
    filteredItems = [...filteredItems, ...matchAddons];
  }

  const hasNewItems = itemCount > 0;
  const hasPreviousOrders = placedOrders.length > 0;

  // Running total across all placed orders
  const placedTotal = placedOrders.reduce(
    (acc, o) => acc + (o.grandTotal || 0),
    0,
  );

  useEffect(() => {
    if (grandTotal > 0 && adjustmentsData) {
      const adjustmentResult = calculateAdjustments(
        grandTotal,
        adjustmentsData,
      );
      setAdjustments(adjustmentResult);
    }
  }, [grandTotal, adjustmentsData]);

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
                <img
                  src={restaurantData.logo}
                  alt={restaurantData?.name || "Restaurant Logo"}
                  className="h-[42px] object-contain max-w-[150px]"
                />
              ) : (
                <h1 className="text-3xl font-black italic tracking-tighter text-gray-900 leading-none">
                  {restaurantData?.name ? (
                    <>
                      {restaurantData.name.split(" ")[0]}
                      <br />
                      {restaurantData.name.split(" ").slice(1).join(" ")}
                    </>
                  ) : (
                    <>
                      la
                      <br />
                      nena
                    </>
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
                {offersData &&
                  offersData.map((o) => (
                    <option key={`offer-${o.id}`} value={`OFFER_${o.id}`}>
                      Offer: {o.name}
                    </option>
                  ))}
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

      {/* Global Search Bar */}
      <div className="px-5 mt-4 mb-6">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input
            type="text"
            className="w-full pl-11 pr-11 py-3.5 bg-white border border-gray-200 rounded-2xl text-[15px] font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all"
            placeholder="Search dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Offers Carousels */}
      {searchQuery.trim() === "" &&
        activeCategory === "ALL" &&
        validOffers.length > 0 && (
          <>
            <hr className="border-t-[6px] border-[#f4f3ef]" />
            <div className="py-8 flex flex-col gap-8">
              {validOffers.map((offer) => {
                let offerItems = menuItems.filter(
                  (i) =>
                    i._offer &&
                    i._offer.id === offer.id &&
                    i.status !== "inactive",
                );
                if (vegOnly) {
                  offerItems = offerItems.filter(
                    (i) => i.isVeg === true || i.isVeg === "true",
                  );
                }
                if (offerItems.length === 0) return null;

                return (
                  <div key={offer.id} className="w-full mx-4">
                    <div className="px-5 flex items-end justify-between mb-3">
                      <h2 className="text-[17px] font-black text-gray-900 tracking-tight leading-none">
                        {offer.name}
                      </h2>
                      <button
                        onClick={() => setActiveCategory(`OFFER_${offer.id}`)}
                        className="text-[#059669] text-xs font-bold active:scale-95 transition-transform"
                      >
                        View All
                      </button>
                    </div>
                    <div
                      className="pl-5 pr-5 pb-2 flex gap-3 overflow-x-auto snap-x hide-scrollbar [&::-webkit-scrollbar]:hidden"
                      style={{ scrollbarWidth: "none" }}
                    >
                      {offerItems.slice(0, 5).map((item) => (
                        <div
                          key={`carousel-${item.id}`}
                          className="shrink-0 snap-start"
                          style={{
                            width: "min(calc(50vw - 26px), 198px)",
                            height: "min(calc(50vw + 60px), 258px)",
                          }}
                        >
                          <MenuCard
                            item={item}
                            onClick={() => setSelectedProduct(item)}
                          />
                        </div>
                      ))}
                      {offerItems.length > 5 && (
                        <div
                          className="shrink-0 snap-center flex items-center justify-center bg-white/50 rounded-2xl border border-gray-100/50 ml-1 shadow-sm h-full min-h-[220px]"
                          style={{ width: "min(calc(50vw - 26px), 198px)" }}
                        >
                          <button
                            onClick={() =>
                              setActiveCategory(`OFFER_${offer.id}`)
                            }
                            className="flex flex-col items-center gap-2 text-[#059669] active:opacity-70 transition-opacity"
                          >
                            <div className="w-12 h-12 rounded-full bg-[#059669]/10 flex items-center justify-center border border-[#059669]/20">
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="9 18 15 12 9 6"></polyline>
                              </svg>
                            </div>
                            <span className="text-[12px] font-bold">
                              See More
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <hr className="border-t-[6px] border-[#f4f3ef] mt-6" />
          </>
        )}

      {/* Title & Selected count */}
      <div className="relative z-10 px-5 pt-8 pb-3 flex items-center justify-between">
        <h2 className="text-[17px] text-gray-900 font-semibold  leading-none">
          {searchQuery.trim() !== ""
            ? "Search Results"
            : activeCategory !== "ALL"
              ? activeCategory.startsWith("OFFER_")
                ? "Offer Items"
                : activeCategory
              : "All Dishes"}
        </h2>
      </div>

      {/* Menu grid */}
      <div className="relative z-10 px-5 pt-2">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <span className="text-4xl mb-3">🍽️</span>
            <p className="text-sm">No items match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                onClick={() => setSelectedProduct(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Standalone Add-ons Section */}
      {searchQuery.trim() === "" &&
        activeCategory === "ALL" &&
        filteredAddons.length > 0 && (
          <div className="relative z-10 mt-2 border-[#f4f3ef] pt-8">
            <div className="px-5 flex items-end justify-between mb-4">
               <h2 className="text-[17px] text-gray-900 font-semibold  leading-none">
                Extra Add-ons
              </h2>
            </div>
            <div className="px-5 pb-8">
              <div className="grid grid-cols-2 gap-3">
                {filteredAddons.map((addon) => (
                  <MenuCard
                    key={addon.id}
                    item={addon}
                    onClick={() => setSelectedProduct(addon)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

      {/* Call Waiter Floating Button */}
      {sessionId && (
        <button
          onClick={handleCallWaiter}
          disabled={callingWaiter}
          className="fixed bottom-[90px] right-5 z-30 bg-white border border-[#059669] text-[#059669] shadow-[0_4px_12px_rgba(5,150,105,0.2)] rounded-full px-4 py-2.5 flex items-center gap-2 font-bold text-[13px] active:scale-95 transition-transform disabled:opacity-50"
        >
          <span className="text-lg">🛎️</span>
          {callingWaiter ? "Notified" : "Waiter"}
        </button>
      )}

      {/* State 1 – fresh cart, no prior orders */}
      {hasNewItems && !hasPreviousOrders && (
        <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white border-t border-gray-100 px-5 py-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 mb-0.5">
              Total
            </span>
            <span className="text-base font-bold text-gray-900 tracking-tight">
              ₹{" "}
              {adjustments
                ? adjustments.adjustedTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 0,
                  })
                : grandTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 0,
                  })}
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
              {adjustments
                ? adjustments.adjustedTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 0,
                  })
                : grandTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 0,
                  })}
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
            View Table Orders
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
      {cartOpen && (
        <CartModal
          onClose={() => setCartOpen(false)}
          adjustments={adjustments}
        />
      )}
      {viewOrderOpen && (
        <ViewOrderModal onClose={() => setViewOrderOpen(false)} />
      )}
      {payBillOpen && <PayBillModal onClose={() => setPayBillOpen(false)} />}
      {selectedProduct && (
        <ProductModal
          item={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
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
