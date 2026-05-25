"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

interface Props {
  trainerName: string;
  userInitial?: string | null;
}

export function ScrollHeader({ trainerName, userInitial }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 200);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-200 ${
        scrolled
          ? "bg-[var(--th-bg)]/95 backdrop-blur-sm border-b border-[var(--th-border)]"
          : "bg-[var(--th-bg)]"
      }`}
    >
      <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/"><BrandLogo /></Link>

        {scrolled && (
          <div className="hidden md:flex items-center gap-2 text-[14px]">
            <span className="text-[var(--th-fg-muted)]">Profil:</span>
            <span className="font-semibold text-[var(--th-fg)]">{trainerName}</span>
          </div>
        )}

        <nav className="flex items-center gap-1">
          <Link
            href="/trainers"
            className="text-[14px] font-medium text-[var(--th-fg-muted)] hover:text-[var(--th-fg)] px-3 py-2 rounded-full transition-colors hover:bg-[var(--th-muted)]"
          >
            ← Edzők
          </Link>
          {userInitial ? (
            <Link
              href="/dashboard"
              className="ml-2 flex items-center gap-2.5 bg-[var(--th-accent)] hover:brightness-95 text-white text-[14px] font-semibold rounded-full pl-3 pr-4 py-2 transition-all shadow-sm"
            >
              <span className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-[12px] font-bold leading-none">
                {userInitial}
              </span>
              Profilom
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
