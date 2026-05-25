"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hu } from "@/messages/hu";

interface Subscription {
  plan: string;
  status: string;
  current_period_end: string;
}

const PLAN_FEATURES = {
  basic: hu.subscription.basicFeatures,
  featured: hu.subscription.featuredFeatures,
};

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("subscriptions")
        .select("plan, status, current_period_end")
        .eq("trainer_id", user.id)
        .maybeSingle();
      setSub(data ?? null);
    }
    load();
  }, []);

  async function startCheckout(plan: "basic" | "featured") {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setLoading(false);
  }

  async function openPortal() {
    setLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setLoading(false);
  }

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat("hu-HU", { dateStyle: "long", timeZone: "Europe/Budapest" }).format(new Date(iso));

  const isActive = sub?.status === "active" || sub?.status === "trialing";

  if (sub === undefined) {
    return <div className="text-[var(--th-fg-muted)] text-sm">Betöltés…</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-[var(--th-fg)]">{hu.dashboard.billing}</h1>

      {sub && (
        <div className="bg-white border border-[var(--th-border)] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-[var(--th-fg)]">
                {hu.subscription[sub.plan as keyof typeof hu.subscription] ?? sub.plan} csomag
              </p>
              <p className="text-sm text-[var(--th-fg-muted)] mt-0.5">
                {hu.subscription[sub.status as keyof typeof hu.subscription] ?? sub.status}
                {sub.current_period_end && ` · ${fmtDate(sub.current_period_end)}-ig`}
              </p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
            }`}>
              {isActive ? "Aktív" : "Inaktív"}
            </span>
          </div>

          <button
            onClick={openPortal}
            disabled={loading}
            className="w-full border border-[var(--th-border)] hover:bg-[var(--th-muted)] disabled:opacity-50 text-[var(--th-fg)] font-medium rounded-full px-4 py-2 transition-all"
          >
            {loading ? "…" : hu.subscription.manage}
          </button>
        </div>
      )}

      {(!sub || !isActive) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(["basic", "featured"] as const).map((plan) => (
            <div
              key={plan}
              className={`bg-white border rounded-xl p-5 space-y-4 ${
                plan === "featured" ? "border-amber-400 ring-1 ring-amber-400" : "border-[var(--th-border)]"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-[var(--th-fg)] text-lg">
                    {hu.subscription[plan]}
                  </h2>
                  {plan === "featured" && (
                    <span className="bg-amber-400 text-amber-900 text-xs font-semibold px-2 py-0.5 rounded-full">
                      Ajánlott
                    </span>
                  )}
                </div>
              </div>
              <ul className="space-y-1.5">
                {PLAN_FEATURES[plan].map((f, i) => (
                  <li key={i} className="text-sm text-[var(--th-fg-muted)] flex gap-2">
                    <span className="text-green-500 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => startCheckout(plan)}
                disabled={loading}
                className={`w-full font-semibold rounded-full px-4 py-2.5 transition-all disabled:opacity-50 ${
                  plan === "featured"
                    ? "bg-amber-400 hover:brightness-95 text-amber-900"
                    : "bg-[var(--th-accent)] hover:brightness-95 text-[var(--th-accent-fg)]"
                }`}
              >
                {loading ? "…" : hu.subscription.subscribe}
              </button>
            </div>
          ))}
        </div>
      )}

      {sub && isActive && sub.plan === "basic" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-amber-900">Frissítés Kiemelt csomagra</h2>
          <ul className="space-y-1.5">
            {hu.subscription.featuredFeatures.slice(1).map((f, i) => (
              <li key={i} className="text-sm text-amber-800 flex gap-2">
                <span className="shrink-0">⭐</span>{f}
              </li>
            ))}
          </ul>
          <button
            onClick={openPortal}
            disabled={loading}
            className="bg-amber-400 hover:brightness-95 disabled:opacity-50 text-amber-900 font-semibold rounded-full px-4 py-2.5 transition-all"
          >
            {loading ? "…" : hu.subscription.upgrade}
          </button>
        </div>
      )}
    </div>
  );
}
