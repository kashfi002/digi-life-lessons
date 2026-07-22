"use client";

/**
 * Pricing / Upgrade — /pricing
 * -----------------------------------------------------------------------
 * Route-level access is handled by pricing/layout.jsx (server-side,
 * logged-out → /login). This page adds one more state on top: if
 * someone who's *already* Premium reaches this page directly (old
 * bookmark, back button, etc.), they see a congratulatory "already
 * Premium" card instead of a purchase button — better than letting
 * them attempt to buy something they already have. The nav/sidebar
 * already hide the Upgrade link entirely for Premium users; this is
 * just the defensive fallback for the page itself.
 *
 * Stripe isn't wired up yet — the button calls
 * POST /api/create-checkout-session on your backend, which doesn't
 * exist yet. It'll fail gracefully with a toast until you build it;
 * say the word and I'll help with the Stripe integration next.
 */

import { useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

const ROWS = [
  { label: "Price", free: "৳0", premium: "৳1,500 one-time" },
  { label: "Lessons you can create", free: "Unlimited", premium: "Unlimited" },
  { label: "Create Premium-only lessons", free: false, premium: true },
  { label: "Access Premium lessons from other creators", free: false, premium: true },
  { label: "Ad-free experience", free: false, premium: true },
  { label: "Priority listing in Public Lessons", free: false, premium: true },
  { label: "Community \"Verified\" badge", free: false, premium: true },
  { label: "Priority support", free: false, premium: true },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const isPremium = Boolean(session?.user?.isPremium);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpgrade = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          email: session.user.email,
        }),
      });
      if (!res.ok) throw new Error("Couldn't start checkout. Try again.");
      const { url } = await res.json();
      if (!url) throw new Error("Checkout session didn't return a redirect URL.");
      window.location.href = url;
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#12141C] px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <span className="font-mono text-[11px] tracking-[0.25em] text-[#F2C14E]">PRICING</span>
          <h1
            className="mt-3 text-[30px] leading-tight text-[#ECEAE3] sm:text-[38px]"
            style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
          >
            One payment. Lifetime access.
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-[#9BA0AF]">
            No subscriptions, no recurring charges — pay once, keep Premium for good.
          </p>
        </div>

        {isPremium ? (
          <AlreadyPremiumCard />
        ) : (
          <>
            {error && (
              <p className="mx-auto mt-8 max-w-md rounded-lg bg-[#E2685C]/10 px-4 py-3 text-center text-[13.5px] text-[#E2685C]">
                {error}
              </p>
            )}

            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <PlanCard title="Free" price="৳0" tagline="Enough to start writing and reading.">
                <ul className="mt-5 flex flex-col gap-2.5 text-[13.5px] text-[#C7C9D1]">
                  <Feature>Create unlimited Free lessons</Feature>
                  <Feature>Browse all public Free lessons</Feature>
                  <Feature>Save to Favorites, like, comment</Feature>
                </ul>
              </PlanCard>

              <PlanCard
                title="Premium ⭐"
                price="৳1,500"
                priceNote="one-time"
                tagline="For people who want the full archive."
                highlighted
              >
                <ul className="mt-5 flex flex-col gap-2.5 text-[13.5px] text-[#ECEAE3]">
                  <Feature accent>Everything in Free</Feature>
                  <Feature accent>Create Premium lessons</Feature>
                  <Feature accent>Read every Premium lesson on the platform</Feature>
                  <Feature accent>Ad-free, priority listing, verified badge</Feature>
                </ul>
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="mt-6 w-full rounded-full bg-[#F2C14E] py-2.5 text-[14px] font-semibold text-[#12141C] transition-colors hover:bg-[#F6CD6C] disabled:opacity-50"
                >
                  {loading ? "Redirecting to checkout…" : "Upgrade to Premium"}
                </button>
              </PlanCard>
            </div>
          </>
        )}

        {/* Comparison table */}
        <div className="mt-14">
          <h2 className="text-center text-[15px] font-semibold text-[#ECEAE3]">
            Free vs Premium, in detail
          </h2>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-white/[0.06]">
            <table className="w-full min-w-[520px] border-collapse text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#1B1E29]">
                  <th className="px-5 py-3.5 font-medium text-[#9BA0AF]">Feature</th>
                  <th className="px-5 py-3.5 text-center font-medium text-[#9BA0AF]">Free</th>
                  <th className="px-5 py-3.5 text-center font-medium text-[#F2C14E]">Premium ⭐</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, i) => (
                  <tr
                    key={row.label}
                    className={i % 2 === 0 ? "bg-[#1B1E29]/40" : "bg-transparent"}
                  >
                    <td className="px-5 py-3.5 text-[#ECEAE3]">{row.label}</td>
                    <td className="px-5 py-3.5 text-center text-[#9BA0AF]">
                      <Cell value={row.free} />
                    </td>
                    <td className="px-5 py-3.5 text-center text-[#ECEAE3]">
                      <Cell value={row.premium} premium />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------------- */

function AlreadyPremiumCard() {
  return (
    <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-3 rounded-2xl border border-[#F2C14E]/25 bg-[#F2C14E]/[0.06] px-8 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F2C14E]/15">
        <CrownIcon />
      </div>
      <p className="text-[18px] font-medium text-[#ECEAE3]">You're already Premium ⭐</p>
      <p className="text-[13.5px] text-[#9BA0AF]">
        Lifetime access is active on your account — thanks for supporting the platform.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-full border border-white/10 px-5 py-2 text-[13.5px] font-medium text-[#ECEAE3] transition-colors hover:bg-white/[0.06]"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}

function PlanCard({ title, price, priceNote, tagline, highlighted, children }) {
  return (
    <div
      className={[
        "rounded-2xl border p-6",
        highlighted
          ? "border-[#F2C14E]/30 bg-[#F2C14E]/[0.06]"
          : "border-white/[0.06] bg-[#1B1E29]",
      ].join(" ")}
    >
      <p className="text-[14px] font-medium text-[#ECEAE3]">{title}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className="text-[30px] leading-none text-[#ECEAE3]"
          style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
        >
          {price}
        </span>
        {priceNote && <span className="text-[12px] text-[#9BA0AF]">{priceNote}</span>}
      </div>
      <p className="mt-1.5 text-[13px] text-[#9BA0AF]">{tagline}</p>
      {children}
    </div>
  );
}

function Feature({ children, accent }) {
  return (
    <li className="flex items-start gap-2">
      <CheckIcon accent={accent} />
      {children}
    </li>
  );
}

function Cell({ value, premium }) {
  if (typeof value === "boolean") {
    return value ? <CheckIcon accent={premium} solo /> : <DashIcon />;
  }
  return <span>{value}</span>;
}

function CheckIcon({ accent, solo }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      className={solo ? "mx-auto" : "mt-0.5 shrink-0"}
    >
      <circle cx="8" cy="8" r="7" stroke={accent ? "#F2C14E" : "#6FAE8C"} strokeWidth="1.3" />
      <path
        d="M4.8 8.2l2 2 4-4.2"
        stroke={accent ? "#F2C14E" : "#6FAE8C"}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="mx-auto">
      <path d="M4 8h8" stroke="#4A4E5C" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 15h14l-1.2-7.5-3.6 3-2.2-5-2.2 5-3.6-3L3 15Z" stroke="#F2C14E" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}