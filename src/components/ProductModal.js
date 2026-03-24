"use client";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import { useState } from "react";

export default function ProductModal({ item, onClose }) {
  const { cart, addToCart, removeFromCart } = useCart();
  
  // Find cart items for this product
  const cartItemsForProduct = cart.filter(c => c.id === item.id);
  
  // Selected variant state
  const hasVariants = item.variants && item.variants.length > 0;
  
  // To allow selecting the original base price alongside custom variants:
  const extendedVariants = hasVariants 
    ? [{ name: "Regular", price: item.price }, ...item.variants] 
    : [];

  const [selectedVariant, setSelectedVariant] = useState(
    hasVariants ? extendedVariants[0] : null
  );

  // Get quantity for currently selected variant (or base item)
  const currentCartItem = cartItemsForProduct.find(c => 
    hasVariants ? c.variantName === selectedVariant?.name : !c.variantName
  );
  
  const quantity = currentCartItem ? currentCartItem.quantity : 0;
  const price = selectedVariant ? selectedVariant.price : item.price;

  const handleToggle = () => {
    if (quantity === 0) {
      addToCart(item, selectedVariant, 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-md rounded-t-[24px] sm:rounded-[24px] overflow-hidden shadow-2xl animate-slide-up flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative w-full aspect-video bg-[#f5f3ee] shrink-0">
          {item.url || item.image ? (
            <Image src={item.url || item.image} alt={item.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
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
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{item.name}</h2>
              </div>
              <span className="font-bold text-lg text-[#059669]">₹ {price}</span>
            </div>
          </div>
          
          {item.description && (
            <p className="text-sm text-gray-500 mt-2 mb-4 leading-relaxed">
              {item.description}
            </p>
          )}

          {hasVariants && (
            <div className="mt-2 border-t border-gray-100 pt-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Select Variant</h3>
              <div className="space-y-2">
                {extendedVariants.map((v, idx) => (
                  <label key={idx} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${selectedVariant?.name === v.name ? 'border-[#059669] bg-[#059669]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selectedVariant?.name === v.name ? 'border-[#059669]' : 'border-gray-300'}`}>
                        {selectedVariant?.name === v.name && <div className="w-3 h-3 bg-[#059669] rounded-full"></div>}
                      </div>
                      <span className="font-medium text-gray-800">{v.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">₹ {v.price}</span>
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
        </div>

        <div className="p-5 border-t border-gray-100 bg-white shrink-0">
          {quantity === 0 ? (
            <button 
              onClick={handleToggle}
              className="w-full bg-[#059669] text-white font-semibold text-lg py-3.5 rounded-xl active:scale-95 transition-transform"
            >
              Add item • ₹ {price}
            </button>
          ) : (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-2 border border-gray-100">
              <div className="flex items-center gap-4 px-4 py-1.5">
                <button 
                  onClick={() => removeFromCart(item, selectedVariant, 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 text-gray-600 active:scale-95"
                >
                  <svg width="14" height="2" viewBox="0 0 10 2" fill="currentColor"><rect width="10" height="2" rx="1"/></svg>
                </button>
                <span className="font-bold text-lg min-w-4 text-center">{quantity}</span>
                <button 
                  onClick={() => addToCart(item, selectedVariant, 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#059669] text-white shadow-sm active:scale-95"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
              </div>
              <div className="px-4 font-bold text-lg text-gray-900">
                ₹ {price * quantity}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
