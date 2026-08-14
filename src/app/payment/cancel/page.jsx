import Link from "next/link";

/**
 * /payment/cancel
 * -----------------------------------------------------------------------
 * Stripe's cancel_url — reached if the user backs out of checkout or
 * the payment fails. No session/data logic needed here, just a clear
 * message and a way back.
 */
export default function PaymentCancelPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#12141C] px-5 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E2685C]/15">
        <XIcon />
      </div>

      <h1
        className="text-[26px] text-[#ECEAE3]"
        style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
      >
        Payment canceled
      </h1>

      <p className="max-w-sm text-[14px] leading-relaxed text-[#9BA0AF]">
        No charge was made. You can try again whenever you're ready.
      </p>

      <div className="mt-2 flex items-center gap-3">
        <Link
          href="/pricing"
          className="rounded-full bg-[#F2C14E] px-6 py-2.5 text-[14px] font-semibold text-[#12141C] transition-colors hover:bg-[#F6CD6C]"
        >
          Back to Pricing
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full border border-white/10 px-6 py-2.5 text-[14px] font-medium text-[#ECEAE3] transition-colors hover:bg-white/[0.06]"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}

function XIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#E2685C" strokeWidth="1.6" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="#E2685C" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}