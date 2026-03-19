"use client";
import { useCart } from "@/context/CartContext";
import Image from "next/image";

export default function MenuCard({ item }) {
  const { cart, addToCart, removeFromCart, setCart } = useCart();
  const cartItem = cart.find((c) => c.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleToggle = () => {
    if (quantity === 0) {
      addToCart(item);
    } else {
      // If clicking the top-right checkmark when already selected, clear it
      setCart((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, quantity: 0 } : i)),
      );
    }
  };

  return (
    <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-2.5 flex flex-col relative">
      {/* Top Right Checkbox / Plus */}
      <button
        onClick={handleToggle}
        className={`absolute top-[0px] right-[0px] z-10 w-5 h-5 rounded-tr-lg rounded-bl-lg flex items-center justify-center rounded-sm border transition-colors ${
          quantity > 0
            ? "bg-[#059669] border-[#059669] text-white"
            : "bg-white border-[#059669] text-[#059669]"
        }`}
      >
        {quantity > 0 ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ) : (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        )}
      </button>

      {/* Image Container */}
      <div className="relative w-full aspect-square rounded-xl bg-[#f5f3ee] overflow-hidden">
        {item.url || item.image ? (
          <Image
            src={item.url || item.image}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🍽️
          </div>
        )}

        {/* Floating Quantity Control (only when selected) */}
        {quantity > 0 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-md flex items-center h-7 px-1 gap-3">
            <button
              onClick={() => removeFromCart(item)}
              className="text-gray-600 font-bold w-5 h-5 flex items-center justify-center active:scale-95"
            >
              <svg width="10" height="2" viewBox="0 0 10 2" fill="currentColor">
                <rect width="10" height="2" rx="1" />
              </svg>
            </button>
            <span className="text-gray-800 font-bold text-[13px] min-w-3 text-center">
              {quantity}
            </span>
            <button
              onClick={() => addToCart(item)}
              className="bg-[#059669] text-white font-bold w-5 h-5 rounded flex items-center justify-center active:scale-95"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="pt-3 pb-1 flex flex-col flex-1">
        <h3 className="font-semibold text-[13px] text-gray-800 leading-snug line-clamp-1">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-tight">
            {item.description}
          </p>
        )}
        <div className="mt-auto pt-2">
          <span className="font-bold text-[13px] text-gray-900">
            ₹ {item.price}
          </span>
        </div>
      </div>
    </div>
  );
}
