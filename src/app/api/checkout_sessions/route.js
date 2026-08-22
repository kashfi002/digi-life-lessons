import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "You must be logged in to upgrade." }, { status: 401 });
    }
    if (session.user.isPremium) {
      return NextResponse.json({ error: "You're already Premium." }, { status: 400 });
    }

    const headersList = await headers();
    const origin = headersList.get("origin");

    const currency = process.env.STRIPE_CURRENCY || "bdt";
    // Smallest currency unit — for BDT that's poisha, so ৳1,500 = 150000.
    // If you switch to usd, this should be cents instead (e.g. 1300 = $13.00).
    const amount = Number(process.env.PREMIUM_PRICE_AMOUNT || 150000);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: amount,
            product_data: {
              name: "Digital Life Lessons — Premium (Lifetime)",
              description: "One-time payment for lifetime Premium access.",
            },
          },
          quantity: 1,
        },
      ],
      customer_email: session.user.email,
      client_reference_id: session.user.id,
      metadata: { userId: session.user.id },
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/cancel`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Checkout session creation failed:", err);
    return NextResponse.json(
      { error: err.message || "Couldn't start checkout." },
      { status: err.statusCode || 500 }
    );
  }
}