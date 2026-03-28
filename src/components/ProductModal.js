"use client";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import { useEffect, useState } from "react";

function buildSizes(item) {
  if (item.variants && item.variants.length > 0) {
    return item.variants.map((v) => ({ name: v.name, price: v.price }));
  }
  return [{ name: "Standard", price: item._discountedPrice ?? item.price }];
}

function applyOffer(price, offer) {
  if (!offer) return price;
  if (offer.discountType === "percentage")
    return price - price * (offer.discountValue / 100);
  if (offer.discountType === "fixed")
    return Math.max(0, price - offer.discountValue);
  return price;
}

function VegBadge({ isVeg }) {
  const veg = isVeg === true || isVeg === "true";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${veg
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-red-600 border border-red-200"
        }`}
    >
      <span className={`w-2 h-2 rounded-full ${veg ? "bg-green-500" : "bg-red-500"}`} />
      {veg ? "Veg" : "Non-Veg"}
    </span>
  );
}

export default function ProductModal({ item, onClose }) {
  const { cart, addToCart, removeFromCart } = useCart();

  const sizes = buildSizes(item);
  const hasVariants = item.variants && item.variants.length > 0;
  const hasAddons = item._addonsConfig && item._addonsConfig.length > 0;

  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const discountedBase = hasVariants
    ? applyOffer(selectedSize.price, item._offer)
    : (item._discountedPrice ?? item.price);

  const addonsTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const displayPrice = discountedBase + addonsTotal;

  const addonKey = selectedAddons.map((a) => a.id).sort().join(",");
  const variantKey = hasVariants ? selectedSize.name : "base";
  const cartItemId = `${item.id}-${variantKey}-${addonKey}`;
  const quantity = cart.find((c) => c.cartItemId === cartItemId)?.quantity ?? 0;

  const handleToggleAddon = (addon) =>
    setSelectedAddons((prev) =>
      prev.find((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon],
    );

  const handleAdd = () =>
    addToCart(item, hasVariants ? selectedSize : null, 1, selectedAddons, discountedBase);

  const handleRemove = () =>
    removeFromCart(item, hasVariants ? selectedSize : null, 1, selectedAddons);

  const handleClose = () => {
    setMounted(false);
    setTimeout(onClose, 260);
  };

  const offerLabel = item._offer
    ? item._offer.discountType === "percentage"
      ? `${item._offer.discountValue}% OFF`
      : `₹${item._offer.discountValue} OFF`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
      onClick={handleClose}
    >
      {/* Sheet */}
      <div
        className="bg-white w-full max-w-md flex flex-col overflow-hidden"
        style={{
          maxHeight: "92vh",
          borderRadius: "24px 24px 0 0",
          transform: mounted ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.28s cubic-bezier(0.32,0.72,0,1)",
          willChange: "transform",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Image — drag handle lives inside here ── */}
        <div className="relative w-full shrink-0" style={{ height: 220 }}>
          {item.url || item.image ? (
            <Image
              src={item.url || item.image}
              alt={item.name}
              fill
              className="object-cover"
              style={{ borderRadius: "24px 24px 0 0" }}
            />
          ) : (
            <div
              className="w-full h-full bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center text-6xl"
              style={{ borderRadius: "24px 24px 0 0" }}
            >
              🍽️
            </div>
          )}

          {/* Subtle top-to-transparent gradient so handle is legible */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" style={{ borderRadius: "24px 24px 0 0" }} />

          {/* ── Drag handle inside image, top-centre ── */}
          <div className="absolute top-3 left-0 right-0 flex justify-center pointer-events-none">
            <div className="w-9 h-[3.5px] bg-white/55 rounded-full" />
          </div>

          {/* Offer pill — offset below handle */}
          {offerLabel && (
            <div className="absolute top-9 left-4 bg-red-500 text-white text-[11px] font-medium px-3 py-1 rounded-full shadow-md tracking-wide">
              🏷 {offerLabel}
            </div>
          )}

          {/* Close button — same row as offer pill */}
          <button
            onClick={handleClose}
            className="absolute top-8 right-4 w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-transform active:scale-90"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Item header ── */}
        <div className="px-5 pt-4 pb-3 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <VegBadge isVeg={item.isVeg} />
                {item.category && (
                  <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                    {item.category}
                  </span>
                )}
              </div>
              <h2 className="text-[18px] font-bold text-gray-900 leading-snug">
                {item.name}
              </h2>
            </div>

            {/* Price */}
            <div className="shrink-0 text-right">
              <p className="text-[21px] font-bold text-[#059669] leading-none">
                ₹{Math.round(displayPrice)}
              </p>
              {item._offer && !hasVariants && item.price !== item._discountedPrice && (
                <p className="text-[12px] text-gray-400 line-through mt-0.5">
                  ₹{item.price}
                </p>
              )}
              {hasVariants && item._offer &&
                selectedSize.price !== applyOffer(selectedSize.price, item._offer) && (
                  <p className="text-[12px] text-gray-400 line-through mt-0.5">
                    ₹{selectedSize.price}
                  </p>
                )}
            </div>
          </div>

          {item.description && (
            <p className="text-[13px] text-gray-500 mt-2 leading-relaxed line-clamp-3">
              {item.description}
            </p>
          )}
        </div>

        <div className="h-px bg-gray-100 mx-5 shrink-0" />

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* Size / Variant selector */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-semibold text-gray-700">
                {sizes.length === 1 ? "Portion" : "Choose Size"}
              </p>
              {sizes.length > 1 && (
                <span className="text-[10px] text-[#059669] font-semibold bg-[#059669]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                  Required
                </span>
              )}
            </div>

            {sizes.length === 1 ? (
              <div className="flex items-center justify-between bg-[#f8faf9] rounded-2xl px-4 py-3.5 border border-[#059669]/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-[#059669]/10 rounded-lg flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  </div>
                  <span className="text-[13px] font-medium text-gray-700">Standard</span>
                </div>
                <span className="text-[15px] font-semibold text-[#059669]">₹{Math.round(discountedBase)}</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {sizes.map((size) => {
                  const sizeDiscounted = applyOffer(size.price, item._offer);
                  const isSelected = selectedSize.name === size.name;
                  const hasDiscount = sizeDiscounted < size.price;

                  const sizeCartId = `${item.id}-${size.name}-${addonKey}`;
                  const sizeQty = cart.find((c) => c.cartItemId === sizeCartId)?.quantity ?? 0;

                  return (
                    <button
                      key={size.name}
                      onClick={() => setSelectedSize(size)}
                      className={`relative flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl border-2 transition-all active:scale-95 ${isSelected
                          ? "border-[#059669] bg-[#059669] shadow-[0_3px_10px_rgba(5,150,105,0.2)]"
                          : "border-gray-200 bg-gray-50"
                        }`}
                    >
                      {sizeQty > 0 && (
                        <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center shadow z-10">
                          {sizeQty}
                        </span>
                      )}
                      {isSelected && (
                        <span className="absolute top-2 right-2 text-white/80">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      )}
                      <span className={`text-[13px] font-medium mb-0.5 ${isSelected ? "text-white" : "text-gray-700"}`}>
                        {size.name}
                      </span>
                      <span className={`text-[14px] font-semibold ${isSelected ? "text-white" : "text-[#059669]"}`}>
                        ₹{Math.round(sizeDiscounted)}
                      </span>
                      {hasDiscount && (
                        <span className={`text-[10px] line-through mt-0.5 ${isSelected ? "text-white/55" : "text-gray-400"}`}>
                          ₹{size.price}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add-ons */}
          {hasAddons && (
            <>
              <div className="h-px bg-gray-100 mx-5" />
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-700">Add-ons</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Customise your order</p>
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold bg-gray-100 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                    Optional
                  </span>
                </div>

                <div className="space-y-2">
                  {item._addonsConfig.map((addon) => {
                    const isSelected = selectedAddons.some((a) => a.id === addon.id);
                    return (
                      <button
                        key={addon.id}
                        onClick={() => handleToggleAddon(addon)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all active:scale-[0.98] text-left ${isSelected
                            ? "border-[#059669] bg-[#f0faf5]"
                            : "border-gray-200 bg-white"
                          }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected
                              ? "border-[#059669] bg-[#059669]"
                              : "border-gray-300 bg-white"
                            }`}
                        >
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <span className="flex-1 text-[13px] font-medium text-gray-800">
                          {addon.name}
                        </span>
                        <span
                          className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${isSelected ? "bg-[#059669] text-white" : "bg-gray-100 text-gray-600"
                            }`}
                        >
                          +₹{addon.price}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedAddons.length > 0 && (
                  <div className="mt-3 flex items-center justify-between bg-[#f0faf5] rounded-xl px-3.5 py-2.5">
                    <span className="text-[12px] text-[#059669] font-medium">
                      {selectedAddons.length} add-on{selectedAddons.length > 1 ? "s" : ""} selected
                    </span>
                    <span className="text-[12px] text-[#059669] font-semibold">
                      +₹{addonsTotal}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Price breakdown */}
          {selectedAddons.length > 0 && (
            <>
              <div className="h-px bg-gray-100 mx-5" />
              <div className="px-5 py-3 space-y-1.5">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Price Summary</p>
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-500">{hasVariants ? selectedSize.name : "Base item"}</span>
                  <span className="font-medium text-gray-700">₹{Math.round(discountedBase)}</span>
                </div>
                {selectedAddons.map((a) => (
                  <div key={a.id} className="flex justify-between text-[13px]">
                    <span className="text-gray-500">{a.name}</span>
                    <span className="font-medium text-gray-700">+₹{a.price}</span>
                  </div>
                ))}
                <div className="flex justify-between text-[14px] font-semibold text-gray-900 pt-1.5 border-t border-dashed border-gray-200">
                  <span>Total</span>
                  <span className="text-[#059669]">₹{Math.round(displayPrice)}</span>
                </div>
              </div>
            </>
          )}

          <div className="h-4" />
        </div>

        {/* ── Sticky footer ── */}
        <div className="shrink-0 bg-white border-t border-gray-100 px-5 pt-3 pb-7 shadow-[0_-6px_20px_rgba(0,0,0,0.05)]">
          {quantity === 0 ? (
            <button
              onClick={handleAdd}
              className="w-full bg-[#059669] text-white font-semibold text-[15px] py-3.5 rounded-2xl active:scale-[0.97] transition-transform shadow-[0_4px_14px_rgba(5,150,105,0.25)] flex items-center justify-between px-5"
            >
              <span className="flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add to Order
              </span>
              <span className="bg-white/20 rounded-xl px-3 py-1 text-[14px] font-semibold">
                ₹{Math.round(displayPrice)}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              {/* Stepper */}
              <div className="flex items-center bg-gray-100 rounded-2xl overflow-hidden shrink-0 border border-gray-200">
                <button
                  onClick={handleRemove}
                  className="w-12 h-12 flex items-center justify-center text-gray-600 active:bg-red-50 active:text-red-500 transition-colors"
                >
                  {quantity === 1 ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  ) : (
                    <svg width="14" height="3" viewBox="0 0 16 3" fill="currentColor">
                      <rect width="16" height="3" rx="1.5" />
                    </svg>
                  )}
                </button>

                <span className="w-10 text-center font-semibold text-[16px] text-gray-900 tabular-nums">
                  {quantity}
                </span>

                <button
                  onClick={handleAdd}
                  className="w-12 h-12 flex items-center justify-center bg-[#059669] text-white active:bg-[#047857] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>

              {/* Total */}
              <div className="flex-1 bg-[#059669] rounded-2xl h-12 flex items-center justify-between px-4 shadow-[0_3px_10px_rgba(5,150,105,0.2)]">
                <div className="flex flex-col">
                  <span className="text-white/65 text-[10px] font-medium leading-none">
                    {quantity} × ₹{Math.round(displayPrice)}
                  </span>
                  <span className="text-white font-semibold text-[15px] leading-tight mt-0.5">
                    ₹{Math.round(displayPrice * quantity)}
                  </span>
                </div>
                <span className="text-white/70 text-[11px] font-medium">in order</span>
              </div>
            </div>
          )}

          {quantity > 0 && (
            <p className="text-center text-[11px] text-gray-400 mt-2">
              Tap − to remove · Tap + to add more
            </p>
          )}
        </div>
      </div>
    </div>
  );
}