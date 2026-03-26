"use client";

import Loader from "@/components/Loader";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FeedbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const otp = searchParams.get("otp");
  const restaurantId = searchParams.get("restaurantId");
  const tableNumber = searchParams.get("tableno");

  return (
    <div className="max-w-md mx-auto min-h-svh bg-white px-6 flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-8 animate-bounce">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#059669"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
        Order Placed!
      </h1>
      <p className="text-[15px] text-gray-500 mb-10 leading-relaxed">
        Your order has been sent to the kitchen.
        <br />
        Sit back and relax while we prepare your meal.
      </p>

      <div className="w-full bg-gray-50 rounded-3xl p-6 mb-10 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400 font-medium">Table No.</span>
          <span className="text-lg font-bold text-gray-900">{tableNumber}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400 font-medium">Session OTP</span>
          <span className="text-lg font-bold text-[#059669] tracking-widest">
            {otp}
          </span>
        </div>
      </div>

      <button
        onClick={() =>
          router.push(`/?restaurantId=${restaurantId}&tableno=${tableNumber}`)
        }
        className="w-full bg-[#059669] text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-100 active:scale-95 transition-transform"
      >
        Order More Items
      </button>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-svh">
          <Loader size="lg" />
        </div>
      }
    >
      <FeedbackContent />
    </Suspense>
  );
}
