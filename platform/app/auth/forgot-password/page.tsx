"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/brand-logo";
import { hu } from "@/messages/hu";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setDone(true);
  }

  return (
    <div className="min-h-screen bg-[var(--th-bg)]">
      <header className="sticky top-0 z-50 bg-[var(--th-bg)]">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><BrandLogo /></Link>
        </div>
      </header>

      <main className="flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-1">
            <h1 className="text-[28px] font-bold text-[var(--th-fg)] tracking-tight">
              {hu.auth.forgotPasswordTitle}
            </h1>
            <p className="text-sm text-[var(--th-fg-muted)]">
              {hu.auth.forgotPasswordDesc}
            </p>
          </div>

          {done ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-[var(--th-fg)]">
                {hu.auth.forgotPasswordSent}
              </p>
              <Link
                href="/auth/login"
                className="text-sm text-[var(--th-accent)] hover:underline"
              >
                {hu.auth.loginLink}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--th-fg)] mb-1.5">
                  {hu.auth.email}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-[var(--th-border)] rounded-xl px-4 py-2.5 text-sm bg-white text-[var(--th-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--th-accent)] placeholder:text-[var(--th-fg-muted)]"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--th-accent)] hover:brightness-95 disabled:opacity-50 text-[var(--th-accent-fg)] font-semibold rounded-full px-4 py-2.5 text-sm transition-all shadow-sm"
              >
                {loading ? "…" : hu.auth.forgotPasswordButton}
              </button>

              <p className="text-center">
                <Link
                  href="/auth/login"
                  className="text-sm text-[var(--th-fg-muted)] hover:text-[var(--th-accent)] hover:underline transition-colors"
                >
                  {hu.auth.loginLink}
                </Link>
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
