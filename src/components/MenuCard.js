"use client";
import { useCart } from "@/context/CartContext";
import Image from "next/image";

export default function MenuCard({ item, onClick }) {
  const { cart, addToCart, removeFromCart } = useCart();
  
  const quantity = cart.filter((c) => c.id === item.id).reduce((sum, c) => sum + c.quantity, 0);
  const hasVariants = item.variants && item.variants.length > 0;

  const handleToggle = (e) => {
    e.stopPropagation();
    if (quantity === 0) {
      if (hasVariants || (item._addonsConfig && item._addonsConfig.length > 0)) {
        if (onClick) onClick();
      } else {
        addToCart(item);
      }
    } else {
      if (hasVariants || (item._addonsConfig && item._addonsConfig.length > 0)) {
        if (onClick) onClick();
      } else {
        cart.filter(c => c.id === item.id).forEach(c => {
          removeFromCart(item, c.variantName ? {name: c.variantName} : null, c.quantity, c.selectedAddons || []);
        });
      }
    }
  };

  return (
    <div onClick={onClick} className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-2.5 flex flex-col h-full relative cursor-pointer active:scale-[0.98] transition-transform">
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

        {item._offer && (
          <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-br-xl z-20 shadow-sm">
            {item._offer.discountType === 'percentage' 
              ? `${item._offer.discountValue}% OFF` 
              : `₹${item._offer.discountValue} OFF`}
          </div>
        )}

        {/* Floating Quantity Control (only when selected) */}
        {quantity > 0 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-md flex items-center h-7 px-1 gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (hasVariants || (item._addonsConfig && item._addonsConfig.length > 0)) {
                  if (onClick) onClick();
                } else {
                  // Direct decrease for simple items, remove just 1 from the first mapped cart row
                  const targetRow = cart.find(c => c.id === item.id);
                  if (targetRow) {
                    removeFromCart(item, targetRow.variantName ? {name: targetRow.variantName} : null, 1, targetRow.selectedAddons || []);
                  }
                }
              }}
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
              onClick={(e) => {
                e.stopPropagation();
                if (hasVariants || (item._addonsConfig && item._addonsConfig.length > 0)) {
                  if (onClick) onClick();
                } else {
                  addToCart(item);
                }
              }}
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
        <div className="flex items-start gap-1">
          {item.isVeg === true || item.isVeg === "true" ? (
            <div className="w-3 h-3 border border-green-600 flex items-center justify-center rounded-[2px] mt-[3px] shrink-0">
              <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
            </div>
          ) : (
            <div className="w-3 h-3 border border-red-600 flex items-center justify-center rounded-[2px] mt-[3px] shrink-0">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
            </div>
          )}
          <h3 className="font-semibold text-[13px] text-gray-800 leading-snug line-clamp-1">
            {item.name}
          </h3>
        </div>
        {item.description && (
          <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-tight">
            {item.description}
          </p>
        )}
        <div className="mt-auto pt-2">
          <div className="flex items-center gap-1.5 mt-0.5">
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
    </div>
  );
}
