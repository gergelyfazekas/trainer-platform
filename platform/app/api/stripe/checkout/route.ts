import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, PLANS, type Plan } from "@/lib/stripe";

export async function POST(request: Request) {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, business_name, tax_id")
    .eq("id", user.id)
    .single();

  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("trainer_id", user.id)
    .maybeSingle();

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: existingSub?.stripe_customer_id ?? undefined,
    customer_email: existingSub ? undefined : user.email,
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
}
