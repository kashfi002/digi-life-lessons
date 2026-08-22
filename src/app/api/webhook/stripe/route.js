import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getDb } from "@/lib/mongodb";
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