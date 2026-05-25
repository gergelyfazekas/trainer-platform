import { createClient } from "@/lib/supabase/server";
import { hu } from "@/messages/hu";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: bookings }, { data: messages }, { data: subscription }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("id")
        .eq("trainer_id", user!.id)
        .eq("status", "pending"),
      supabase
        .from("messages")
        .select("id")
        .eq("trainer_id", user!.id)
        .eq("is_read", false),
      supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("trainer_id", user!.id)
        .maybeSingle(),
    ]);

  const planLabel = subscription
    ? hu.subscription[subscription.plan as keyof typeof hu.subscription] ?? subscription.plan
    : "—";
  const statusLabel = subscription
    ? hu.subscription[subscription.status as keyof typeof hu.subscription] ?? subscription.status
    : "—";

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-[var(--th-fg)]">
        {hu.dashboard.overview}
      </h1>

      <div className="grid grid-cols-3 gap-4">
        <Stat label={hu.dashboard.pendingBookings} value={bookings?.length ?? 0} />
        <Stat label={hu.dashboard.unreadMessages} value={messages?.length ?? 0} />
        <Stat
          label={hu.dashboard.subscriptionStatus}
          value={subscription ? `${planLabel} – ${statusLabel}` : "—"}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-[var(--th-border)] rounded-xl p-4">
      <p className="text-sm text-[var(--th-fg-muted)]">{label}</p>
      <p className="text-2xl font-semibold text-[var(--th-fg)] mt-1">{value}</p>
    </div>
  );
}
