"use client";

import Link from "next/link";

interface Props {
  trainerId: string;
  hourlyRate: number | null;
}

const HU_FT = (n: number) => new Intl.NumberFormat("hu-HU").format(n) + " Ft";

export function MobileBar({ trainerId, hourlyRate }: Props) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[var(--th-border)] px-4 py-3 flex items-center gap-3 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.08)]">
      <div className="flex-1 min-w-0">
        {hourlyRate ? (
          <p className="text-[15px] font-bold text-[var(--th-fg)]">
            {HU_FT(hourlyRate)} <span className="font-normal text-[13px] text-[var(--th-fg-muted)]">/ óra</span>
          </p>
        ) : (
          <p className="text-[15px] font-bold text-[var(--th-fg)]">Egyeztetős</p>
        )}
        <p className="text-[11.5px] text-emerald-700 font-medium">Első konzultáció ingyenes</p>
      </div>
      <Link
        href={`/book/${trainerId}`}
        className="bg-[var(--th-accent)] text-white font-semibold rounded-full px-5 py-2.5 text-[14px] hover:brightness-95 transition-all"
      >
        Foglalás
      </Link>
    </div>
  );
}
