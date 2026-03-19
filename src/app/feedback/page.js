"use client";

import Loader from "@/components/Loader";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FeedbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const otp = searchParams.get("otp") || "---";

  return (
    <div className="max-w-md mx-auto min-h-svh flex flex-col relative bg-[#fffdfa] bg-food-pattern bg-repeat">
      {/* Gradient to fade pattern at the bottom */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/20 via-white/80 to-white via-[25vh] to-[45vh] z-0" />

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center pt-24 px-6 pb-8">
        {/* Circle Image */}
        <div className="w-45 h-45 rounded-full border-4 border-[#aba182] overflow-hidden shadow-lg mb-8">
          <Image
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop"
            alt="Delicious Food"
            width={180}
            height={180}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>

        {/* OTP Text */}
        <h1 className="text-[60px] font-bold text-black leading-none tracking-tight">
          {otp}
        </h1>

        {/* Status */}
        <h2 className="text-[17px] font-bold text-black mt-6">Order Placed</h2>

        {/* Description */}
        <p className="text-[13px] text-gray-800 text-center mt-3 px-6 leading-relaxed font-medium">
          Someone will reach you shortly. Please give them the above code.
        </p>

        {/* Bottom Button */}
        <div className="mt-auto pt-10 w-full">
          <button
            onClick={() => router.push("/")}
            className="w-full bg-[#059669] text-white font-semibold text-[15px] py-4 rounded-xl active:scale-95 transition-transform shadow-md"
          >
            Go To Menu
          </button>
        </div>
      </div>
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
