'use client';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';

export default function CartItem({ item }) {
  const { addToCart, removeFromCart, setCart } = useCart();
  
  const handleRemoveAll = () => {
    setCart((prev) => prev.map((i) => (i.id === item.id ? { ...i, quantity: 0 } : i)));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-2.5 flex items-stretch gap-3">
      {/* Item Image */}
      <div className="relative w-18 h-18 rounded-xl bg-[#f5f3ee] overflow-hidden shrink-0">
        {item.url || item.image ? (
          <Image
            src={item.url || item.image}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
        )}
      </div>

      {/* Item Details */}
      <div className="flex-1 flex flex-col justify-between py-0.5">
        <div>
          <h3 className="font-semibold text-[13px] text-gray-800 leading-snug line-clamp-1">{item.name}</h3>
          <p className="font-bold text-[13px] text-gray-900 mt-1">₹ {item.price}</p>
        </div>

        <div className="flex items-center justify-between mt-auto pt-2">
          {/* Trash Icon */}
          <button 
            onClick={handleRemoveAll}
            className="text-red-500 p-1 -ml-1 hover:bg-red-50 rounded active:scale-95 transition-transform"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>

          {/* Quantity Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => removeFromCart(item)}
              className="text-gray-600 font-bold w-5 h-5 flex items-center justify-center active:scale-95"
            >
              <svg width="10" height="2" viewBox="0 0 10 2" fill="currentColor"><rect width="10" height="2" rx="1"/></svg>
            </button>
            <span className="text-gray-800 font-bold text-[13px] min-w-3 text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => addToCart(item)}
              className="bg-[#059669] text-white font-bold w-5 h-5 rounded flex items-center justify-center active:scale-95"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
