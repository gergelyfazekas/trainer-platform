"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageForm } from "@/components/message-form";

interface Props {
  trainerId: string;
  hourlyRate: number | null;
  trainerName: string;
  nearestSlots: string[];
  phone: string | null;
}

const HU_FT = (n: number) => new Intl.NumberFormat("hu-HU").format(n) + " Ft";

const fmtSlot = (iso: string) => {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("hu-HU", { month: "short", day: "numeric", timeZone: "Europe/Budapest" }).format(d);
  const time = new Intl.DateTimeFormat("hu-HU", { timeStyle: "short", timeZone: "Europe/Budapest" }).format(d);
  return `${date} ${time}`;
};

export function BookingCard({ trainerId, hourlyRate, nearestSlots, phone }: Props) {
  const [tab, setTab] = useState<"book" | "message" | "phone">("book");

  return (
    <div className="bg-white border border-[var(--th-border)] rounded-2xl shadow-[0_8px_36px_-12px_rgba(15,23,42,0.18)] overflow-hidden">
      {/* Price header */}
      <div className="px-6 pt-5 pb-4 border-b border-[var(--th-border)]">
        {hourlyRate ? (
          <div>
            <span className="text-[26px] font-bold text-[var(--th-fg)] tracking-tight">{HU_FT(hourlyRate)}</span>
            <span className="text-[14px] text-[var(--th-fg-muted)] ml-1">/ óra</span>
          </div>
        ) : (
          <span className="text-[20px] font-bold text-[var(--th-fg)]">Egyeztetős díj</span>
        )}
        <p className="mt-2 text-[13px] text-[var(--th-fg-muted)] flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="currentColor">
            <circle cx="12" cy="12" r="6" />
          </svg>
          Az első konzultáció{" "}
          <span className="font-semibold text-emerald-700">ingyenes</span>
        </p>
      </div>

      {/* Tab switch */}
      <div className="px-3 pt-3">
        <div className={`grid bg-[var(--th-muted)] rounded-full p-0.5 text-[13.5px] font-semibold ${phone ? "grid-cols-3" : "grid-cols-2"}`}>
          <button
            onClick={() => setTab("book")}
            className={`py-2 rounded-full transition-all ${
              tab === "book" ? "bg-white text-[var(--th-fg)] shadow-sm" : "text-[var(--th-fg-muted)]"
            }`}
          >
            Foglalás
          </button>
          <button
            onClick={() => setTab("message")}
            className={`py-2 rounded-full transition-all ${
              tab === "message" ? "bg-white text-[var(--th-fg)] shadow-sm" : "text-[var(--th-fg-muted)]"
            }`}
          >
            Üzenet
          </button>
          {phone && (
            <button
              onClick={() => setTab("phone")}
              className={`py-2 rounded-full transition-all ${
                tab === "phone" ? "bg-white text-[var(--th-fg)] shadow-sm" : "text-[var(--th-fg-muted)]"
              }`}
            >
              Telefon
            </button>
          )}
        </div>
      </div>

      {tab === "book" ? (
        <div className="p-5 space-y-4">
          <Link
            href={`/book/${trainerId}`}
            className="w-full bg-[var(--th-accent)] hover:brightness-95 text-white font-semibold rounded-full px-4 py-3 text-[15px] transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Ingyenes konzultáció foglalása
          </Link>

          {nearestSlots.length > 0 && (
            <div className="border-t border-[var(--th-border)] pt-4">
              <p className="text-[12px] text-[var(--th-fg-muted)] mb-2.5">Következő szabad időpontok</p>
              <div className="grid grid-cols-3 gap-1.5">
                {nearestSlots.map((iso) => (
                  <Link
                    key={iso}
                    href={`/book/${trainerId}?slot=${encodeURIComponent(iso)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] py-1.5 px-1 rounded-lg bg-[var(--th-muted)] hover:bg-[var(--th-border)] text-[var(--th-fg)] font-medium transition-colors text-center"
                  >
                    {fmtSlot(iso)}
                  </Link>
                ))}
              </div>
              <Link
                href={`/book/${trainerId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full text-center text-[13px] font-medium text-[var(--th-accent)] hover:underline underline-offset-2 block"
              >
                Több időpont megtekintése →
              </Link>
            </div>
          )}

        </div>
      ) : tab === "phone" && phone ? (
        <div className="p-5 space-y-3">
          <div className="rounded-2xl border border-[var(--th-border)] bg-[var(--th-muted)]/40 px-4 py-5 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[var(--th-border)] mb-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-[var(--th-accent)]" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
              </svg>
            </div>
            <p className="text-[12px] text-[var(--th-fg-muted)] uppercase tracking-wider font-semibold mb-1">Telefonszám</p>
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="block text-[22px] font-bold text-[var(--th-fg)] tracking-tight hover:text-[var(--th-accent)] transition-colors"
            >
              {phone}
            </a>
          </div>
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="w-full bg-[var(--th-accent)] hover:brightness-95 text-white font-semibold rounded-full px-4 py-3 text-[15px] transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
            </svg>
            Hívás indítása
          </a>
        </div>
      ) : (
        <div className="p-5">
          <MessageForm trainerId={trainerId} />
        </div>
      )}
    </div>
  );
}
