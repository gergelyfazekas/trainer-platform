import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hu } from "@/messages/hu";

type SetupStep = {
  key: string;
  label: string;
  description: string;
  done: boolean;
  href: string;
  critical?: boolean;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: bookings },
    { data: messages },
    { data: subscription },
    { data: profile },
    { count: packageCount },
    { count: slotCount },
  ] = await Promise.all([
    supabase.from("bookings").select("id").eq("trainer_id", user!.id).eq("status", "pending"),
    supabase.from("messages").select("id").eq("trainer_id", user!.id).eq("is_read", false),
    supabase.from("subscriptions").select("plan, status").eq("trainer_id", user!.id).maybeSingle(),
    supabase.from("profiles").select("full_name, city, hourly_rate, profile_photo, avail_weekdays, avail_weekends").eq("id", user!.id).single(),
    supabase.from("packages").select("*", { count: "exact", head: true }).eq("trainer_id", user!.id),
    supabase.from("availability_slots").select("*", { count: "exact", head: true }).eq("trainer_id", user!.id),
  ]);

  const isActiveSub = subscription?.status === "active" || subscription?.status === "trialing";

  const planLabel = subscription
    ? hu.subscription[subscription.plan as keyof typeof hu.subscription] ?? subscription.plan
    : "—";
  const statusLabel = subscription
    ? hu.subscription[subscription.status as keyof typeof hu.subscription] ?? subscription.status
    : "—";

  const setupSteps: SetupStep[] = [
    {
      key: "profile",
      label: "Alap profil",
      description: "Teljes név, város, óradíj és profilfotó megadása",
      done: !!(profile?.full_name && profile?.city && profile?.hourly_rate != null && profile?.profile_photo),
      href: "/dashboard/profile?edit=1",
    },
    {
      key: "availability",
      label: "Elérhetőség",
      description: "Add meg, mikor érsz rá edzeni",
      done:
        (profile?.avail_weekdays?.length ?? 0) > 0 ||
        (profile?.avail_weekends?.length ?? 0) > 0 ||
        (slotCount ?? 0) > 0,
      href: "/dashboard/availability",
    },
    {
      key: "packages",
      label: "Csomagok és árak",
      description: "Add meg legalább egy edzési csomagot",
      done: (packageCount ?? 0) > 0,
      href: "/dashboard/packages",
    },
    {
      key: "subscription",
      label: "Előfizetés aktiválása",
      description: "Aktív előfizetés nélkül nem jelensz meg a keresésben",
      done: isActiveSub,
      href: "/dashboard/billing",
      critical: true,
    },
  ];

  const allSetupDone = setupSteps.every((s) => s.done);
  const doneCount = setupSteps.filter((s) => s.done).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-[var(--th-fg)]">
        {hu.dashboard.overview}
      </h1>

      {!allSetupDone && (
        <SetupChecklist steps={setupSteps} doneCount={doneCount} />
      )}

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

function SetupChecklist({ steps, doneCount }: { steps: SetupStep[]; doneCount: number }) {
  const total = steps.length;

  return (
    <div className="bg-white border border-[var(--th-border)] rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-[var(--th-fg)]">Fiókod beállítása</h2>
          <p className="text-sm text-[var(--th-fg-muted)] mt-0.5">
            Töltsd ki az alábbi lépéseket, hogy megjelenj a keresési találatokban.
          </p>
        </div>
        <span className="shrink-0 text-sm font-bold text-[var(--th-accent)] tabular-nums">
          {doneCount}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[var(--th-muted)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--th-accent)] rounded-full transition-all duration-500"
          style={{ width: `${(doneCount / total) * 100}%` }}
        />
      </div>

      <ul className="space-y-1.5">
        {steps.map((step) => (
          <li key={step.key}>
            {step.done ? (
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
                <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 12 12" className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M2 6l2.5 2.5 5.5-5" />
                  </svg>
                </span>
                <span className="text-sm text-[var(--th-fg-muted)]">{step.label}</span>
              </div>
            ) : (
              <Link
                href={step.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group ${
                  step.critical
                    ? "bg-amber-50 border border-amber-200 hover:bg-amber-100"
                    : "hover:bg-[var(--th-muted)]"
                }`}
              >
                <span className={`w-5 h-5 rounded-full border-2 shrink-0 ${
                  step.critical ? "border-amber-400" : "border-[var(--th-border)] group-hover:border-[var(--th-accent)]"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${step.critical ? "text-amber-900" : "text-[var(--th-fg)]"}`}>
                    {step.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${step.critical ? "text-amber-700" : "text-[var(--th-fg-muted)]"}`}>
                    {step.description}
                  </p>
                </div>
                <span className={`shrink-0 text-xs font-semibold rounded-full px-3 py-1.5 transition-all ${
                  step.critical
                    ? "bg-amber-400 text-amber-900 group-hover:brightness-95"
                    : "bg-[var(--th-accent)] text-white group-hover:brightness-95"
                }`}>
                  Kitöltés →
                </span>
              </Link>
            )}
          </li>
        ))}
      </ul>
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
