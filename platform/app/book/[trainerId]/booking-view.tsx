"use client";

import { useState } from "react";
import Link from "next/link";
import { hu } from "@/messages/hu";
import { BrandLogo } from "@/components/brand-logo";

interface Trainer {
  id: string;
  full_name: string | null;
  hourly_rate: number | null;
}

interface Props {
  trainer: Trainer;
  availableSlots: string[];
  preselectedSlot: string | null;
}

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("hu-HU", { dateStyle: "short", timeZone: "Europe/Budapest" }).format(new Date(iso));

const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("hu-HU", { timeStyle: "short", timeZone: "Europe/Budapest" }).format(new Date(iso));

export function BookingView({ trainer, availableSlots, preselectedSlot }: Props) {
  const [selected, setSelected] = useState<string | null>(preselectedSlot);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error" | "taken">("idle");

  const byDate: Record<string, string[]> = {};
  for (const iso of availableSlots) {
    const label = fmtDate(iso);
    if (!byDate[label]) byDate[label] = [];
    byDate[label].push(iso);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setStatus("submitting");

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trainer_id: trainer.id,
        visitor_name: name,
        visitor_email: email,
        visitor_phone: phone,
        appointment_at: selected,
        duration_min: 60,
        notes,
      }),
    });

    if (res.status === 409) { setStatus("taken"); return; }
    setStatus(res.ok ? "done" : "error");
  }

  if (status === "done") {
    return (
      <div className="min-h-screen bg-[var(--th-bg)] flex items-center justify-center px-4">
        <div className="max-w-sm text-center space-y-4">
          <p className="text-green-700 font-semibold text-lg">{hu.booking.success}</p>
          <Link href={`/trainers/${trainer.id}`} className="text-[var(--th-accent)] hover:underline text-sm">
            ← Vissza a profilhoz
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--th-bg)]">
      <header className="sticky top-0 z-50 bg-[var(--th-bg)]">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><BrandLogo /></Link>
          <Link href={`/trainers/${trainer.id}`} className="text-[14px] font-medium text-[var(--th-fg-muted)] hover:text-[var(--th-fg)] px-3 py-2 rounded-full transition-colors hover:bg-[var(--th-muted)]">
            ← {trainer.full_name}
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-[var(--th-fg)] mb-2">{hu.booking.title}</h1>
        <p className="text-[var(--th-fg-muted)] mb-6">{trainer.full_name}</p>

        {availableSlots.length === 0 ? (
          <p className="text-[var(--th-fg-muted)]">{hu.booking.selectSlot} — jelenleg nincs elérhető időpont.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Slot picker */}
            <div className="space-y-4">
              <h2 className="font-semibold text-[var(--th-fg)]">{hu.booking.selectSlot}</h2>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {Object.entries(byDate).map(([date, isos]) => (
                  <div key={date}>
                    <p className="text-xs font-semibold text-[var(--th-fg-muted)] uppercase mb-1">{date}</p>
                    <div className="flex flex-wrap gap-2">
                      {isos.map((iso) => (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => setSelected(iso)}
                          className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                            selected === iso
                              ? "bg-[var(--th-accent)] text-[var(--th-accent-fg)] border-[var(--th-accent)]"
                              : "bg-white text-[var(--th-fg)] border-[var(--th-border)] hover:border-[var(--th-accent)]"
                          }`}
                        >
                          {fmtTime(iso)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <h2 className="font-semibold text-[var(--th-fg)]">Adataid</h2>
              {selected && (
                <p className="text-sm text-[var(--th-accent)] bg-[var(--th-muted)] rounded-xl px-3 py-2">
                  Kiválasztott időpont: <strong>{fmtDate(selected)} {fmtTime(selected)}</strong>
                </p>
              )}
              <div>
                <label className="block text-sm font-medium text-[var(--th-fg)] mb-1">{hu.booking.name} <span className="text-red-500">*</span></label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--th-fg)] mb-1">{hu.booking.email} <span className="text-red-500">*</span></label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--th-fg)] mb-1">{hu.booking.phone} <span className="text-red-500">*</span></label>
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--th-fg)] mb-1">{hu.booking.notes}</label>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
              </div>

              {status === "taken" && <p className="text-red-500 text-sm">{hu.booking.slotTaken}</p>}
              {status === "error" && <p className="text-red-500 text-sm">{hu.booking.error}</p>}

              <button
                type="submit"
                disabled={!selected || status === "submitting"}
                className="w-full bg-[var(--th-accent)] hover:brightness-95 disabled:opacity-50 text-[var(--th-accent-fg)] font-semibold rounded-full px-4 py-2.5 transition-all shadow-sm"
              >
                {status === "submitting" ? "…" : hu.booking.submit}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

const inputClass = "w-full border border-[var(--th-border)] rounded-xl px-4 py-2.5 text-sm bg-white text-[var(--th-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--th-accent)] placeholder:text-[var(--th-fg-muted)]";
