"use client";
import { useCart } from "@/context/CartContext";
import { sessionService } from "@/libs/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CartItem from "./CartItem";
import CustomerDetailsForm from "./CustomerDetailsForm";
import Loader from "./Loader";

export default function CartModal({ onClose, adjustments }) {
  const {
    cart,
    subtotal,
    tax,
    grandTotal,
    restaurantId,
    tableNumber,
    clearCart,
    sessionId,
    otp,
    initSession,
    placedOrders,
    addPlacedOrder,
    customerInfo,
    setCustomerInfo,
    joinedSession,
  } = useCart();

  const router = useRouter();

  // Determine starting step per-device: ask for details only if this device
  // has not captured customerInfo yet.
  const hasCustomerInfo = !!customerInfo;
  const [step, setStep] = useState(hasCustomerInfo ? "review" : "details");
  const [toast, setToast] = useState("");

  useEffect(() => {
    // If customerInfo is restored asynchronously (localStorage), ensure we
    // start on review rather than details.
    if (customerInfo && step === "details") setStep("review");
  }, [customerInfo, step]);

  const cartItems = cart.filter((i) => i.quantity > 0);

  // Totals for previously placed orders
  const previousTotal = placedOrders.reduce(
    (acc, o) => acc + (o.grandTotal || 0),
    0,
  );

  const deviceName = customerInfo
    ? `${customerInfo.firstName}${
        customerInfo.lastName ? " " + customerInfo.lastName : ""
      }`
    : "";
  const hasPlacedByDevice = deviceName
    ? placedOrders.some((o) => o.orderedBy === deviceName)
    : false;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDetailsSubmit = (info) => {
    setCustomerInfo(info);
    setStep("review");
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    if (!customerInfo) {
      setStep("details");
      return;
    }
    setStep("loading");

    // Ensure session is initialised (idempotent)
    if (!sessionId || !otp) initSession();

    const effectiveSessionId = sessionId;
    const effectiveOtp = otp;

    const sessionMeta = {
      tableNumber,
      otp: effectiveOtp,
      customerName: `${customerInfo.firstName}${customerInfo.lastName ? " " + customerInfo.lastName : ""}`,
      customerPhone: customerInfo.phone || "",
      numberOfPeople: customerInfo.numberOfPeople || "1",
    };

    const orderPayload = {
      items: cartItems.map((i) => ({
        id: i.id,
        name: i.name,
        price: parseFloat(i.price),
        quantity: i.quantity,
      })),
      subtotal,
      tax,
      grandTotal,
    };

    try {
      const orderId = await sessionService.placeOrder(
        restaurantId,
        effectiveSessionId,
        sessionMeta,
        orderPayload,
      );

      // Record this batch locally
      addPlacedOrder({
        ...orderPayload,
        orderId,
        orderedBy: sessionMeta.customerName,
        placedAt: new Date().toISOString(),
      });
      clearCart();

      // Navigate to feedback
      router.push(
        `/feedback?otp=${effectiveOtp}&restaurantId=${restaurantId}&tableno=${tableNumber}`,
      );
    } catch (e) {
      console.error("Error placing order:", e);
      setStep("review");
      setToast("Failed to place order. Please try again.");
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  const headerTitle =
    step === "details"
      ? "Fill Your Details To Order"
      : step === "review"
        ? "Review Your Order"
        : "Placing Order…";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              step === "review" && !hasPlacedByDevice
                ? setStep("details")
                : onClose()
            }
            className="text-gray-800 active:scale-95 transition-transform"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 className="text-[15px] font-semibold text-gray-800">
            {headerTitle}
          </h2>
        </div>
        <div className="text-right text-[10px] text-gray-800 font-medium">
          <p>
            Table No.{" "}
            <span className="font-bold text-xs">{tableNumber ?? "—"}</span>
          </p>
          <p>
            Sesh. <span className="font-bold text-xs">{otp ?? "—"}</span>
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast ? (
        <div className="bg-red-50 text-red-600 text-xs font-medium px-5 py-2 text-center border-b border-red-100">
          {toast}
        </div>
      ) : null}

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        {/* Loading */}
        {step === "loading" && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader size="lg" />
            <p className="text-gray-500 text-sm font-medium">
              Placing your order…
            </p>
          </div>
        )}

        {/* Customer Details */}
        {step === "details" && (
          <div className="p-5">
            <CustomerDetailsForm onSubmit={handleDetailsSubmit} isJoined={joinedSession} />
          </div>
        )}

        {/* Review */}
        {step === "review" && (
          <div className="p-5 flex flex-col gap-6">
            {/* Previously ordered items */}
            {placedOrders.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Previously Ordered
                </p>

                <div className="space-y-4 opacity-70">
                  {placedOrders.map((order, oi) => (
                    <div
                      key={order.id || oi}
                      className="bg-gray-50 border border-gray-100 rounded-2xl p-3"
                    >
                      <p className="text-[12px] font-bold text-gray-500 mb-2">
                        Round {order.roundNumber ?? oi + 1}
                        {order.orderedBy ? ` - ${order.orderedBy}` : ""}
                      </p>
                      <div className="space-y-2">
                        {order.items.map((item, ii) => (
                          <div
                            key={`${order.id || oi}-${ii}`}
                            className="flex items-center justify-between text-sm text-gray-600"
                          >
                            <span>
                              {item.name} × {item.quantity}
                            </span>
                            <span>
                              ₹{" "}
                              {(item.price * item.quantity).toLocaleString(
                                "en-IN",
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-xs font-semibold text-gray-500 mt-2 pt-2 border-t border-dashed border-gray-200">
                  <span>Previous total (incl. GST)</span>
                  <span>
                    ₹{" "}
                    {previousTotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </div>
            )}

            {/* New items */}
            {cartItems.length > 0 && (
              <div>
                {placedOrders.length > 0 && (
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    New Items
                  </p>
                )}
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <CartItem key={item.cartItemId || item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer – only for review step */}
      {step === "review" && (
        <div className="shrink-0 bg-white px-5 pt-4 pb-6 border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-500">Subtotal</span>
            <span className="text-sm text-gray-700">
              ₹ {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">GST (5%)</span>
            <span className="text-sm text-gray-700">
              ₹ {tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          {adjustments &&
            adjustments.breakdown.map((adj) => (
              <div
                key={adj.id}
                className="flex items-center justify-between mb-1"
              >
                <span className="text-sm text-gray-500">{adj.name}</span>
                <span className="text-sm text-gray-700">
                  {adj.amount > 0
                    ? `+₹ ${adj.amount.toLocaleString("en-IN")}`
                    : `-₹ ${Math.abs(adj.amount).toLocaleString("en-IN")}`}
                </span>
              </div>
            ))}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[17px] font-bold text-gray-800">Total</span>
            <span className="text-[17px] font-bold text-gray-900 tracking-tight">
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
            onClick={handlePlaceOrder}
            disabled={cartItems.length === 0}
            className="w-full bg-[#059669] text-white font-semibold text-[15px] py-3.5 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
          >
            {hasPlacedByDevice ? "Add To My Order →" : "Place Order"}
          </button>
        </div>
      )}
    </div>
  );
}
