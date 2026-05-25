import Link from "next/link";
import { hu } from "@/messages/hu";
import { BrandLogo } from "@/components/brand-logo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--th-bg)] flex flex-col">
      <header className="sticky top-0 z-50 bg-[var(--th-bg)] border-b border-[var(--th-border)]">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center">
          <Link href="/"><BrandLogo /></Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-6">
          <p className="text-[120px] font-bold text-[var(--th-border)] leading-none select-none">404</p>
          <p className="text-lg font-medium text-[var(--th-fg)]">{hu.errors.notFound}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="bg-[var(--th-accent)] hover:brightness-95 text-[var(--th-accent-fg)] font-semibold rounded-full px-6 py-2.5 text-sm transition-all shadow-sm"
            >
              {hu.errors.backToHome}
            </Link>
            <Link
              href="/trainers"
              className="border border-[var(--th-border)] hover:bg-[var(--th-muted)] text-[var(--th-fg)] font-medium rounded-full px-6 py-2.5 text-sm transition-all"
            >
              {hu.errors.browseTrainers}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
