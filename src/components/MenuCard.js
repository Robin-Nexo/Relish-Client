"use client";
import { useCart } from "@/context/CartContext";
import Image from "next/image";

export default function MenuCard({ item, onClick }) {
  const { cart } = useCart();

  // Total quantity of this item across all variants/addons
  const quantity = cart
    .filter((c) => c.id === item.id)
    .reduce((sum, c) => sum + c.quantity, 0);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-2.5 flex flex-col h-full relative cursor-pointer active:scale-[0.98] transition-transform"
    >
      {/* Top-right indicator: tick if in cart, plus if not */}
      <div
        className={`absolute top-0 right-0 z-10 w-6 h-6 rounded-tr-[18px] rounded-bl-xl flex items-center justify-center transition-colors ${quantity > 0
            ? "bg-[#059669] text-white"
            : "bg-white border border-[#059669] text-[#059669]"
          }`}
      >
        {quantity > 0 ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </div>

      {/* Image */}
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

        {item._offer && (
          <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-br-xl z-20 shadow-sm">
            {item._offer.discountType === "percentage"
              ? `${item._offer.discountValue}% OFF`
              : `₹${item._offer.discountValue} OFF`}
          </div>
        )}

        {/* Quantity badge — bottom-right of image */}
        {quantity > 0 && (
          <div className="absolute bottom-1.5 right-1.5 bg-[#059669] text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
            {quantity}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="pt-2.5 pb-1 flex flex-col flex-1">
        <div className="flex items-start gap-1">
          {item.isVeg === true || item.isVeg === "true" ? (
            <div className="w-3 h-3 border border-green-600 flex items-center justify-center rounded-[2px] mt-[3px] shrink-0">
              <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
            </div>
          ) : (
            <div className="w-3 h-3 border border-red-600 flex items-center justify-center rounded-[2px] mt-[3px] shrink-0">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
            </div>
          )}
          <h3 className="font-semibold text-[13px] text-gray-800 leading-snug line-clamp-2">
            {item.name}
          </h3>
        </div>

        {item.description && (
          <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-tight">
            {item.description}
          </p>
        )}

        <div className="mt-auto pt-2 flex items-center gap-1.5">
          <span className="font-bold text-[14px] text-gray-900 tracking-tight">
            ₹{item._discountedPrice ?? item.price}
          </span>
          {item._offer && (
            <span className="text-[11px] text-gray-400 font-medium line-through">
              ₹{item.price}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
