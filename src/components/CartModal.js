"use client";
import { useCart } from "@/context/CartContext";
import { ordersService } from "@/libs/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CartItem from "./CartItem";
import CustomerDetailsForm from "./CustomerDetailsForm";
import Loader from "./Loader";

export default function CartModal({ onClose }) {
  const {
    cart,
    subtotal,
    tax,
    grandTotal,
    restaurantId,
    tableNumber,
    clearCart,
  } = useCart();
  const [step, setStep] = useState("details"); // 'details' | 'review' | 'loading'
  const [toast, setToast] = useState("");
  const [customerInfo, setCustomerInfo] = useState(null);
  const router = useRouter();

  const [otp] = useState(() => Math.floor(1000 + Math.random() * 9000));
  const cartItems = cart.filter((i) => i.quantity > 0);

  const handleDetailsSubmit = (info) => {
    setCustomerInfo(info);
    setStep("review");
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0 || !customerInfo) return;
    setStep("loading");

    const orderData = {
      restaurantId,
      tableNumber,
      customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
      customerPhone: customerInfo.phone,
      items: cartItems.map((i) => ({
        id: i.id,
        name: i.name,
        price: parseFloat(i.price),
        quantity: i.quantity,
      })),
      subtotal,
      tax,
      grandTotal,
      status: "OPEN",
      otp: otp.toString(),
    };

    try {
      await ordersService.placeOrder(restaurantId, orderData);
      clearCart();
      router.push(`/feedback?otp=${otp}&restaurantId=${restaurantId}`);
    } catch (e) {
      console.error("Error placing order:", e);
      setStep("review");
      setToast("Failed to place order. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden animate-slide-up">
      {/* Header matching Image 3 & 4 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (step === "review" ? setStep("details") : onClose())}
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
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <h2 className="text-[15px] font-semibold text-gray-800">
            {step === "details"
              ? "Fill Your Details To Order"
              : step === "review"
                ? "Review Your Order"
                : "Placing Order..."}
          </h2>
        </div>
        <div className="text-right text-[10px] text-gray-800 font-medium">
          <p>
            Table No. <span className="font-bold text-xs">21</span>
          </p>
          <p>
            Sesh. <span className="font-bold text-xs">1234</span>
          </p>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-white">
        {step === "loading" && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader size="lg" />
            <p className="text-gray-500 text-sm font-medium">
              Placing your order…
            </p>
          </div>
        )}

        {step === "details" && (
          <div className="p-5">
            <CustomerDetailsForm onSubmit={handleDetailsSubmit} />
          </div>
        )}

        {step === "review" && (
          <div className="p-5 flex flex-col min-h-full">
            <div className="space-y-4">
              {cartItems.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            <div className="mt-auto pt-8">
              {/* Sticky footer for Place Order (Image 4 bottom) */}
            </div>
          </div>
        )}
      </div>

      {/* Footer sticky for Review Step */}
      {step === "review" && (
        <div className="shrink-0 bg-white px-5 pt-4 pb-6 border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[17px] font-bold text-gray-800">Total</span>
            <span className="text-[17px] font-bold text-gray-900 tracking-tight">
              ₹{" "}
              {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </span>
          </div>
          <button
            onClick={handlePlaceOrder}
            className="w-full bg-[#059669] text-white font-semibold text-[15px] py-3.5 rounded-xl active:scale-95 transition-transform"
          >
            Place Order
          </button>
        </div>
      )}
    </div>
  );
}
