import { NextResponse } from "next/server";
import { getStripe, planFromPriceId } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const trainerId = session.metadata?.trainer_id;
        if (!trainerId) break;

        const subscription = await getStripe().subscriptions.retrieve(
          session.subscription as string
        );
        const priceId = subscription.items.data[0].price.id;
        const plan = planFromPriceId(priceId);
        if (!plan) break;

        // current_period_end is on the item in the dahlia API
        const periodEnd = subscription.items.data[0].current_period_end;

        await supabase.from("subscriptions").upsert(
          {
            trainer_id: trainerId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
            plan,
            status: subscription.status as "active" | "past_due" | "cancelled" | "trialing",
            current_period_end: new Date(periodEnd * 1000).toISOString(),
          },
          { onConflict: "trainer_id" }
        );

        await supabase
          .from("profiles")
          .update({ is_active: true, is_featured: plan === "featured" })
          .eq("id", trainerId);

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const trainerId = subscription.metadata?.trainer_id;
        if (!trainerId) break;

        const priceId = subscription.items.data[0].price.id;
        const plan = planFromPriceId(priceId);
        if (!plan) break;

        const isActive =
          subscription.status === "active" || subscription.status === "trialing";

        const periodEnd = subscription.items.data[0].current_period_end;

        await supabase
          .from("subscriptions")
          .update({
            stripe_price_id: priceId,
            plan,
            status: subscription.status as "active" | "past_due" | "cancelled" | "trialing",
            current_period_end: new Date(periodEnd * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        await supabase
          .from("profiles")
          .update({
            is_active: isActive,
            is_featured: isActive && plan === "featured",
          })
          .eq("id", trainerId);

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const trainerId = subscription.metadata?.trainer_id;
        if (!trainerId) break;

        await supabase
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("stripe_subscription_id", subscription.id);

        await supabase
          .from("profiles")
          .update({ is_active: false, is_featured: false })
          .eq("id", trainerId);

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        // In the dahlia API, subscription is under invoice.parent.subscription_details.subscription
        const subId =
          invoice.parent?.subscription_details?.subscription;
        if (!subId) break;

        const subIdStr = typeof subId === "string" ? subId : subId.id;

        await supabase
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_subscription_id", subIdStr);

        const { data: sub } = await supabase
          .from("subscriptions")
          .select("trainer_id")
          .eq("stripe_subscription_id", subIdStr)
          .single();

        if (sub) {
          await supabase
            .from("profiles")
            .update({ is_active: false, is_featured: false })
            .eq("id", sub.trainer_id);
        }

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
