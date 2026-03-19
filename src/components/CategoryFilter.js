'use client';
import { useCart } from '@/context/CartContext';

export default function CategoryFilter({ categories, activeCategory, onChange }) {
  const allCategories = [{ id: 'ALL', name: 'ALL' }, ...categories];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-4 scrollbar-hide">
      {allCategories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.name)}
          className={`flex-shrink-0 px-5 py-2 rounded-2xl text-xs font-semibold transition-all duration-200 ${
            cat.name === activeCategory
              ? 'bg-[#B2AC88] text-white shadow-md shadow-[#b2ac8880]'
              : 'bg-[#b2ac88] bg-opacity-30 text-gray-700 hover:bg-opacity-60'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
