"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { hu } from "@/messages/hu";
import { BrandLogo } from "@/components/brand-logo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "success" | "error">("loading");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStatus("ready");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setLoading(false);
      return;
    }

    setStatus("success");
    setTimeout(() => router.push("/auth/login"), 2000);
  }

  return (
    <div className="min-h-screen bg-[var(--th-bg)]">
      <header className="sticky top-0 z-50 bg-[var(--th-bg)]">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center">
          <Link href="/"><BrandLogo /></Link>
        </div>
      </header>

      <main className="flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-sm space-y-8">
          {status === "loading" && (
            <p className="text-center text-sm text-[var(--th-fg-muted)]">…</p>
          )}

          {status === "ready" && (
            <>
              <div className="text-center">
                <h1 className="text-[28px] font-bold text-[var(--th-fg)] tracking-tight">
                  {hu.auth.resetPasswordTitle}
                </h1>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--th-fg)] mb-1.5">
                    {hu.auth.password}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-[var(--th-border)] rounded-xl px-4 py-2.5 text-sm bg-white text-[var(--th-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--th-accent)]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[var(--th-accent)] hover:brightness-95 disabled:opacity-50 text-[var(--th-accent-fg)] font-semibold rounded-full px-4 py-2.5 text-sm transition-all shadow-sm"
                >
                  {loading ? "…" : hu.auth.resetPasswordButton}
                </button>
              </form>
            </>
          )}

          {status === "success" && (
            <p className="text-center text-sm text-green-600">
              {hu.auth.resetPasswordSuccess}
            </p>
          )}

          {status === "error" && (
            <div className="text-center space-y-4">
              <p className="text-sm text-red-500">{hu.errors.generic}</p>
              <Link href="/auth/forgot-password" className="text-sm text-[var(--th-accent)] hover:underline">
                {hu.auth.forgotPasswordLink}
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
