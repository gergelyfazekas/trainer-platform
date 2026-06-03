import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, PLANS, type Plan } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = (await request.json()) as { plan: Plan };

    if (!PLANS[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const [{ data: existingSub }, { data: profile }] = await Promise.all([
      supabase.from("subscriptions").select("stripe_customer_id").eq("trainer_id", user.id).maybeSingle(),
      supabase.from("profiles").select("business_name").eq("id", user.id).single(),
    ]);

    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

    // For new subscribers with a business name, pre-create the Stripe customer so
    // the business name appears on invoices without the trainer having to retype it.
    let customerId = existingSub?.stripe_customer_id ?? undefined;
    if (!customerId && profile?.business_name) {
      const customer = await getStripe().customers.create({
        email: user.email ?? undefined,
        name: profile.business_name,
        metadata: { trainer_id: user.id },
      });
      customerId = customer.id;
    }

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: PLANS[plan], quantity: 1 }],
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      billing_address_collection: "required",
      success_url: `${origin}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/billing`,
      metadata: { trainer_id: user.id, plan },
      subscription_data: {
        metadata: { trainer_id: user.id, plan },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "stripe_error" }, { status: 502 });
  }
}
