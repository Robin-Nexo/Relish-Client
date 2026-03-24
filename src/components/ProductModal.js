"use client";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import { useState } from "react";

export default function ProductModal({ item, onClose }) {
  const { cart, addToCart, removeFromCart } = useCart();

  // Find cart items for this product
  const cartItemsForProduct = cart.filter((c) => c.id === item.id);

  // Selected variant state
  const hasVariants = item.variants && item.variants.length > 0;

  // To allow selecting the original base price alongside custom variants:
  const extendedVariants = hasVariants
    ? [{ name: "Regular", price: item.price }, ...item.variants]
    : [];

  const [selectedVariant, setSelectedVariant] = useState(
    hasVariants ? extendedVariants[0] : null,
  );

  const [selectedAddons, setSelectedAddons] = useState([]);

  // Calculate dynamic discounted price for the selected variant
  const basePrice = selectedVariant ? selectedVariant.price : item.price;
  let finalBasePrice = basePrice;
  if (item._offer) {
    if (item._offer.discountType === "percentage") {
      finalBasePrice =
        basePrice - basePrice * (item._offer.discountValue / 100);
    } else {
      finalBasePrice = Math.max(0, basePrice - item._offer.discountValue);
    }
  }

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const displayPrice = finalBasePrice + addonsTotal;

  // Get quantity for currently selected configuration (variant + exact addons)
  const currentCartItem = cartItemsForProduct.find((c) => {
    const variantMatch = hasVariants
      ? c.variantName === selectedVariant?.name
      : !c.variantName;

    // Check if the currently chosen addons match exactly what is in the cart row
    const cartAddonIds = c.selectedAddons
      ? c.selectedAddons
          .map((a) => a.id)
          .sort()
          .join(",")
      : "";
    const stateAddonIds = selectedAddons
      .map((a) => a.id)
      .sort()
      .join(",");
    const addonsMatch = cartAddonIds === stateAddonIds;

    return variantMatch && addonsMatch;
  });

  const quantity = currentCartItem ? currentCartItem.quantity : 0;

  const handleToggleAddon = (addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.find((a) => a.id === addon.id);
      if (exists) return prev.filter((a) => a.id !== addon.id);
      return [...prev, addon];
    });
  };

  const handleAddToCart = () => {
    // Pass the calculated final discounted price into context, overriding standard mapping.
    // Ensure selectedAddons are passed cleanly.
    addToCart(item, selectedVariant, 1, selectedAddons, finalBasePrice);
  };

  const handleRemoveFromCart = () => {
    removeFromCart(item, selectedVariant, 1, selectedAddons);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-[24px] sm:rounded-[24px] overflow-hidden shadow-2xl animate-slide-up flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full aspect-video bg-[#f5f3ee] shrink-0">
          {item.url || item.image ? (
            <Image
              src={item.url || item.image}
              alt={item.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              🍽️
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-800 shadow-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-5 flex flex-col flex-1 overflow-y-auto">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {item.isVeg === true || item.isVeg === "true" ? (
                  <div className="w-4 h-4 border border-green-600 flex items-center justify-center rounded-sm shrink-0">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                ) : (
                  <div className="w-4 h-4 border border-red-600 flex items-center justify-center rounded-sm shrink-0">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  </div>
                )}
                <h2 className="text-base font-bold text-gray-900 leading-tight">
                  {item.name}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#059669]">
                  ₹{finalBasePrice}
                </span>
                {item._offer && (
                  <span className="text-xs text-gray-400 line-through">
                    ₹{basePrice}
                  </span>
                )}
              </div>
            </div>
          </div>

          {item.description && (
            <p className="text-xs text-gray-500 mt-2 mb-4 leading-relaxed">
              {item.description}
            </p>
          )}

          {hasVariants && (
            <div className="mt-2 border-t border-gray-100 pt-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3">
                Select Variant
              </h3>
              <div className="space-y-2">
                {extendedVariants.map((v, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${selectedVariant?.name === v.name ? "border-[#059669] bg-[#059669]/5" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selectedVariant?.name === v.name ? "border-[#059669]" : "border-gray-300"}`}
                      >
                        {selectedVariant?.name === v.name && (
                          <div className="w-3 h-3 bg-[#059669] rounded-full"></div>
                        )}
                      </div>
                      <span className="font-medium text-sm text-gray-800">
                        {v.name}
                      </span>
                    </div>
                    <span className="font-semibold text-sm text-gray-900">
                      ₹ {v.price}
                    </span>
                    <input
                      type="radio"
                      name="variant"
                      className="hidden"
                      checked={selectedVariant?.name === v.name}
                      onChange={() => setSelectedVariant(v)}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {item._addonsConfig && item._addonsConfig.length > 0 && (
            <div className="mt-2 border-t border-gray-100 pt-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Add-ons</h3>
              <div className="space-y-2">
                {item._addonsConfig.map((addon) => {
                  const isSelected = selectedAddons.some(
                    (a) => a.id === addon.id,
                  );
                  return (
                    <label
                      key={addon.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${isSelected ? "border-[#059669] bg-[#059669]/5" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? "border-[#059669] bg-[#059669]" : "border-gray-300"}`}
                        >
                          {isSelected && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </div>
                        <span className="font-medium text-sm text-gray-800">
                          {addon.name}
                        </span>
                      </div>
                      <span className="font-semibold text-sm text-gray-900">
                        +₹ {addon.price}
                      </span>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isSelected}
                        onChange={() => handleToggleAddon(addon)}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 bg-white shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
          {quantity === 0 ? (
            <button
              onClick={handleAddToCart}
              className="w-full bg-[#059669] text-white font-semibold text-sm py-3.5 rounded-xl active:scale-95 transition-transform"
            >
              Add to Order • ₹{displayPrice}
            </button>
          ) : (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-2 border border-gray-100">
              <div className="flex items-center gap-4 px-4 py-1.5">
                <button
                  onClick={handleRemoveFromCart}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 text-gray-600 active:scale-95"
                >
                  <svg
                    width="14"
                    height="2"
                    viewBox="0 0 10 2"
                    fill="currentColor"
                  >
                    <rect width="10" height="2" rx="1" />
                  </svg>
                </button>
                <span className="font-bold text-sm min-w-4 text-center">
                  {quantity}
                </span>
                <button
                  onClick={handleAddToCart}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#059669] text-white shadow-sm active:scale-95"
                >
                  <svg
                    width="14"
                    height="14"
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
              <div className="px-4 font-bold text-sm text-gray-900">
                ₹{displayPrice * quantity}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
