"use client";
import { useCart } from "@/context/CartContext";

export default function ViewOrderModal({ onClose }) {
  const { placedOrders, otp, tableNumber } = useCart();

  const grandTotal = placedOrders.reduce((acc, o) => acc + (o.grandTotal || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-gray-800 active:scale-95 transition-transform">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 className="text-[15px] font-semibold text-gray-800">Table Orders</h2>
        </div>
        <div className="text-right text-[10px] text-gray-800 font-medium">
          <p>Table No. <span className="font-bold text-xs">{tableNumber ?? "—"}</span></p>
          <p>Sesh. <span className="font-bold text-xs">{otp ?? "—"}</span></p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {placedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <span className="text-4xl">🍽️</span>
            <p className="text-sm">No orders placed yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {placedOrders.map((order, oi) => (
              <div key={order.id || oi} className="bg-gray-50 rounded-2xl p-4">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Round {order.roundNumber ?? oi + 1}
                  {order.orderedBy ? ` - ${order.orderedBy}` : ""}
                </p>
                <div className="space-y-2">
                  {order.items.map((item, ii) => (
                    <div key={ii} className="flex items-center justify-between text-sm text-gray-700">
                      <span>{item.name} <span className="text-gray-400">× {item.quantity}</span></span>
                      <span className="font-medium">₹ {(item.price * item.quantity).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-3 pt-2 border-t border-gray-200">
                  <span>Subtotal</span>
                  <span>₹ {(order.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>GST (5%)</span>
                  <span>₹ {(order.tax || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-800 mt-2 pt-2 border-t border-gray-200">
                  <span>Order Total</span>
                  <span>₹ {(order.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer – running total */}
      {placedOrders.length > 0 && (
        <div className="shrink-0 bg-white px-5 pt-4 pb-6 border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-[17px] font-bold text-gray-800">Running Total</span>
            <span className="text-[17px] font-bold text-gray-900 tracking-tight">
              ₹ {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Inclusive of all taxes</p>
        </div>
      )}
    </div>
  );
}
