"use client";

import Link from "next/link";
import { hu } from "@/messages/hu";
import { BrandLogo } from "@/components/brand-logo";

export default function Error({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div className="min-h-screen bg-[var(--th-bg)] flex flex-col">
      <header className="sticky top-0 z-50 bg-[var(--th-bg)] border-b border-[var(--th-border)]">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center">
          <Link href="/"><BrandLogo /></Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-6">
          <p className="text-lg font-medium text-[var(--th-fg)]">{hu.errors.generic}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={unstable_retry}
              className="bg-[var(--th-accent)] hover:brightness-95 text-[var(--th-accent-fg)] font-semibold rounded-full px-6 py-2.5 text-sm transition-all shadow-sm"
            >
              {hu.errors.tryAgain}
            </button>
            <Link
              href="/"
              className="border border-[var(--th-border)] hover:bg-[var(--th-muted)] text-[var(--th-fg)] font-medium rounded-full px-6 py-2.5 text-sm transition-all"
            >
              {hu.errors.backToHome}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
