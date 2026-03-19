'use client';
import { useCart } from '@/context/CartContext';

export default function CartSummaryBar({ onViewCart }) {
  const { itemCount, grandTotal } = useCart();
  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-5 py-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-gray-500 mb-0.5">Total</span>
        <span className="text-base font-bold text-gray-900 tracking-tight">₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
      </div>
      <button
        onClick={onViewCart}
        className="bg-[#059669] text-white font-semibold text-sm rounded-[10px] px-5 py-2.5 flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        View Order
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </button>
    </div>
  );
}
