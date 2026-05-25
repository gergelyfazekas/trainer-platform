"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/brand-logo";
import { hu } from "@/messages/hu";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--th-bg)]">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-[var(--th-bg)]">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><BrandLogo /></Link>
          <nav className="flex items-center gap-1">
            <Link href="/trainers" className="text-[14px] font-medium text-[var(--th-fg-muted)] hover:text-[var(--th-fg)] px-3 py-2 rounded-full transition-colors hover:bg-[var(--th-muted)]">
              {hu.nav.trainers}
            </Link>
            <Link href="/auth/register" className="ml-2 bg-[var(--th-accent)] hover:brightness-95 text-[var(--th-accent-fg)] text-[14px] font-semibold rounded-full px-5 py-2 transition-all shadow-sm">
              {hu.hero.trainerCta}
            </Link>
          </nav>
        </div>
      </header>

      {/* Form */}
      <main className="flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-1">
            <h1 className="text-[28px] font-bold text-[var(--th-fg)] tracking-tight">
              {hu.auth.loginTitle}
            </h1>
            <p className="text-sm text-[var(--th-fg-muted)]">
              {hu.auth.noAccount}{" "}
              <Link href="/auth/register" className="text-[var(--th-accent)] hover:underline font-medium">
                {hu.auth.registerLink}
              </Link>
            </p>
          </div>

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
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[var(--th-fg)]">
                  {hu.auth.password}
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-[var(--th-fg-muted)] hover:text-[var(--th-accent)] hover:underline transition-colors"
                >
                  {hu.auth.forgotPasswordLink}
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[var(--th-border)] rounded-xl px-4 py-2.5 text-sm bg-white text-[var(--th-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--th-accent)] placeholder:text-[var(--th-fg-muted)]"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--th-accent)] hover:brightness-95 disabled:opacity-50 text-[var(--th-accent-fg)] font-semibold rounded-full px-4 py-2.5 text-sm transition-all shadow-sm mt-2"
            >
              {loading ? "…" : hu.auth.loginButton}
            </button>
          </form>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--th-border)]" />
            <span className="text-xs text-[var(--th-fg-muted)]">vagy</span>
            <div className="flex-1 h-px bg-[var(--th-border)]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 border border-[var(--th-border)] rounded-full px-4 py-2.5 text-sm font-medium text-[var(--th-fg)] bg-white hover:bg-[var(--th-muted)] transition-all"
          >
            <GoogleIcon />
            {hu.auth.googleButton}
          </button>
        </div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" fillRule="evenodd">
        <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </g>
    </svg>
  );
}
