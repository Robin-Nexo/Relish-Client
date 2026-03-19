"use client";
import { useCart } from "@/context/CartContext";
import { sessionService } from "@/libs/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Loader from "./Loader";

export default function PayBillModal({ onClose }) {
  const {
    placedOrders,
    tax: currentTax,
    restaurantId,
    tableNumber,
    sessionId,
    otp,
    endSession,
  } = useCart();

  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  // Total across all placed order batches
  const subtotalAll = placedOrders.reduce((acc, o) => acc + (o.subtotal || 0), 0);
  const taxAll = placedOrders.reduce((acc, o) => acc + (o.tax || 0), 0);
  const grandTotalAll = placedOrders.reduce((acc, o) => acc + (o.grandTotal || 0), 0);

  const handlePayBill = async () => {
    setPaying(true);
    try {
      await sessionService.paySessionBill(restaurantId, sessionId);
      endSession();
      router.push(`/?restaurantId=${restaurantId}&tableno=${tableNumber}`);
    } catch (e) {
      console.error("Error paying bill:", e);
      setError("Could not process payment. Please ask staff for assistance.");
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-gray-800 active:scale-95 transition-transform" disabled={paying}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 className="text-[15px] font-semibold text-gray-800">Pay Bill</h2>
        </div>
        <div className="text-right text-[10px] text-gray-800 font-medium">
          <p>Table No. <span className="font-bold text-xs">{tableNumber ?? "—"}</span></p>
          <p>Sesh. <span className="font-bold text-xs">{otp ?? "—"}</span></p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {paying ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader size="lg" />
            <p className="text-gray-500 text-sm font-medium">Processing payment…</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Bill breakdown */}
            <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
              {placedOrders.map((order, oi) => (
                <div key={oi} className="flex justify-between text-sm text-gray-600">
                  <span>Order {oi + 1}</span>
                  <span>₹ {(order.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-3 space-y-1">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>₹ {subtotalAll.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>GST (5%)</span>
                  <span>₹ {taxAll.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-[17px] font-bold text-gray-800">
                <span>Grand Total</span>
                <span>₹ {grandTotalAll.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</span>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center font-medium">{error}</p>
            )}

            {/* Info note */}
            <div className="flex items-start gap-2 text-[12px] text-gray-400 px-1">
              <span className="mt-0.5">ℹ️</span>
              <p>Tap "Confirm Payment" once you've paid at the counter. This will clear your session.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {!paying && (
        <div className="shrink-0 bg-white px-5 pt-4 pb-6 border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <button
            onClick={handlePayBill}
            className="w-full bg-[#059669] text-white font-semibold text-[15px] py-3.5 rounded-xl active:scale-95 transition-transform"
          >
            Confirm Payment →
          </button>
        </div>
      )}
    </div>
  );
}
