"use client";

/**
 * /payment/success
 * -----------------------------------------------------------------------
 * Stripe redirects here after a successful checkout. The webhook (a
 * separate, server-to-server request from Stripe) is what actually
 * flips isPremium — it can arrive slightly before or after the browser
 * lands on this page. So this page polls the session a few times
 * rather than assuming it's already updated the instant it loads.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

export default function PaymentSuccessPage() {
  const { data: session, refetch } = useSession();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (session?.user?.isPremium) {
      setChecking(false);
      return;
    }

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      await refetch?.();
      if (session?.user?.isPremium || attempts >= 6) {
        clearInterval(interval);
        setChecking(false);
      }
    }, 1500);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPremium = Boolean(session?.user?.isPremium);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#12141C] px-5 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F2C14E]/15">
        {checking ? <SpinnerIcon /> : <CheckIcon />}
      </div>

      <h1
        className="text-[26px] text-[#ECEAE3]"
        style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
      >
        {checking ? "Confirming your payment…" : isPremium ? "Welcome to Premium ⭐" : "Payment received"}
      </h1>

      <p className="max-w-sm text-[14px] leading-relaxed text-[#9BA0AF]">
        {checking
          ? "Stripe confirmed the payment — just finishing setting up your account."
          : isPremium
          ? "Lifetime Premium access is now active on your account."
          : "Your payment went through. If your account doesn't show Premium in a minute, refresh this page."}
      </p>

      {!checking && (
        <Link
          href="/dashboard"
          className="mt-2 rounded-full bg-[#F2C14E] px-6 py-2.5 text-[14px] font-semibold text-[#12141C] transition-colors hover:bg-[#F6CD6C]"
        >
          Go to Dashboard
        </Link>
      )}
    </main>
  );
}

function SpinnerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="animate-spin text-[#F2C14E]">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#F2C14E" strokeWidth="1.6" />
      <path d="M7.5 12.5l3 3 6-6.5" stroke="#F2C14E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}