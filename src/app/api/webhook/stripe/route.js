import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getDb } from "@/lib/mongodb";

/**
 * POST /api/webhook/stripe
 * -----------------------------------------------------------------------
 * This is the ONLY place isPremium actually flips to true — never done
 * client-side, never done in the success page. The success page just
 * shows a friendly message; this webhook is the source of truth,
 * because it's the only step that's actually verified a real payment
 * happened (via the signature check below).
 *
 * Updates the user by EMAIL rather than by id. This sidesteps needing
 * to know exactly how better-auth's mongodb adapter represents `id`
 * internally (string vs ObjectId) — email is guaranteed unique and was
 * explicitly set as customer_email when the checkout session was
 * created, so it's a reliable match either way.
 *
 * Local testing: run the Stripe CLI alongside your dev server —
 *   stripe listen --forward-to localhost:3000/api/webhook/stripe
 * — and put the "whsec_..." it prints into STRIPE_WEBHOOK_SECRET in
 * .env. Without this running, Stripe has no way to reach your local
 * machine and isPremium will never update on localhost.
 */
export async function POST(req) {
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text(); // must be the raw, unparsed body for signature verification

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_email || session.customer_details?.email;

    if (!email) {
      console.error("checkout.session.completed had no email — can't upgrade anyone.", session.id);
      return NextResponse.json({ received: true });
    }

    try {
      const db = await getDb();
      const result = await db
        .collection("user")
        .updateOne({ email }, { $set: { isPremium: true } });

      if (result.matchedCount === 0) {
        console.error(`Webhook: no user found with email ${email} to upgrade.`);
      }
    } catch (err) {
      console.error("Failed to update isPremium after payment:", err);
      // Still return 200 below — Stripe will retry on non-2xx, but a DB
      // error here needs manual investigation, not an automatic retry loop.
    }
  }

  return NextResponse.json({ received: true });
}