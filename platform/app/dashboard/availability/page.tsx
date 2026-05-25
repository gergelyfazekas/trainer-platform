"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hu } from "@/messages/hu";
import type { Database } from "@/types/database";

type Slot = Database["public"]["Tables"]["availability_slots"]["Row"];

const DAYS = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"];
const DISPLAY_TO_DOW = [1, 2, 3, 4, 5, 6, 0];

const TIME_PARTS = [
  { value: "morning", label: "Reggel", sub: "6–12" },
  { value: "daytime", label: "Napközben", sub: "12–17" },
  { value: "evening", label: "Este", sub: "17–22" },
] as const;

type TimePart = (typeof TIME_PARTS)[number]["value"];

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newSlot, setNewSlot] = useState({ displayDay: 0, start_time: "09:00", end_time: "17:00" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // General availability
  const [availWeekdays, setAvailWeekdays] = useState<TimePart[]>([]);
  const [availWeekends, setAvailWeekends] = useState<TimePart[]>([]);
  const [availWeekdaysSnapshot, setAvailWeekdaysSnapshot] = useState<TimePart[]>([]);
  const [availWeekendsSnapshot, setAvailWeekendsSnapshot] = useState<TimePart[]>([]);
  const [generalEditing, setGeneralEditing] = useState(false);
  const [generalSaving, setGeneralSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: profile }, { data: slotData }] = await Promise.all([
        supabase.from("profiles").select("avail_weekdays, avail_weekends").eq("id", user.id).single(),
        supabase.from("availability_slots").select("*").eq("trainer_id", user.id).order("day_of_week").order("start_time"),
      ]);

      if (profile) {
        const wd = (profile.avail_weekdays ?? []) as TimePart[];
        const we = (profile.avail_weekends ?? []) as TimePart[];
        setAvailWeekdays(wd);
        setAvailWeekends(we);
        setAvailWeekdaysSnapshot(wd);
        setAvailWeekendsSnapshot(we);
      }
      setSlots(slotData ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function togglePeriod(
    part: TimePart,
    current: TimePart[],
    setter: (v: TimePart[]) => void
  ) {
    setter(current.includes(part) ? current.filter((p) => p !== part) : [...current, part]);
    setSuccess(null);
  }

  function toggleDay(
    current: TimePart[],
    setter: (v: TimePart[]) => void
  ) {
    setter(current.length > 0 ? [] : ["morning", "daytime", "evening"]);
    setSuccess(null);
  }

  function enterGeneralEdit() {
    setAvailWeekdaysSnapshot(availWeekdays);
    setAvailWeekendsSnapshot(availWeekends);
    setGeneralEditing(true);
  }

  function cancelGeneralEdit() {
    setAvailWeekdays(availWeekdaysSnapshot);
    setAvailWeekends(availWeekendsSnapshot);
    setGeneralEditing(false);
  }

  async function saveGeneral() {
    if (!userId) return;
    setGeneralSaving(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ avail_weekdays: availWeekdays, avail_weekends: availWeekends })
      .eq("id", userId);
    setAvailWeekdaysSnapshot(availWeekdays);
    setAvailWeekendsSnapshot(availWeekends);
    setGeneralSaving(false);
    setGeneralEditing(false);
    setSuccess(hu.dashboard.saveSuccess);
    setTimeout(() => setSuccess(null), 4000);
  }

  async function addSlot() {
    if (!userId) return;
    const dow = DISPLAY_TO_DOW[newSlot.displayDay];
    if (newSlot.start_time >= newSlot.end_time) {
      setError("A kezdési időpont nem lehet a befejezési előtt.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("availability_slots")
      .insert({ trainer_id: userId, day_of_week: dow, start_time: newSlot.start_time, end_time: newSlot.end_time })
      .select()
      .single();
    if (err) { setError(err.message); } else if (data) {
      setSlots((prev) => [...prev, data]);
      setSuccess(hu.dashboard.saveSuccess);
      setTimeout(() => setSuccess(null), 4000);
    }
    setSaving(false);
  }

  async function deleteSlot(id: string) {
    const supabase = createClient();
    await supabase.from("availability_slots").delete().eq("id", id);
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }

  const byDay: Record<number, Slot[]> = {};
  slots.forEach((s) => {
    const displayDay = DISPLAY_TO_DOW.indexOf(s.day_of_week);
    if (displayDay === -1) return;
    if (!byDay[displayDay]) byDay[displayDay] = [];
    byDay[displayDay].push(s);
  });

  if (loading) return <div className="text-[var(--th-fg-muted)] text-sm">Betöltés…</div>;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--th-fg)]">Elérhetőség</h1>
        <p className="text-sm text-[var(--th-fg-muted)] mt-1">
          Add meg az általános elérhetőségedet és a konkrét idősávjaidat.
        </p>
      </div>

      {/* General availability */}
      <div className="bg-white border border-[var(--th-border)] rounded-xl p-5 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-[var(--th-fg)]">Általános elérhetőség</h2>
            <p className="text-xs text-[var(--th-fg-muted)] mt-0.5">
              Jelöld meg, hogy általánosságban mikor érsz rá edzeni.
            </p>
          </div>
          {!generalEditing && (
            <button
              type="button"
              onClick={enterGeneralEdit}
              className="shrink-0 flex items-center gap-1.5 text-sm font-medium text-[var(--th-fg-muted)] hover:text-[var(--th-fg)] border border-[var(--th-border)] rounded-full px-3 py-1.5 hover:bg-[var(--th-muted)] transition-all"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Szerkesztés
            </button>
          )}
        </div>

        {generalEditing ? (
          <>
            {/* Weekdays — edit */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--th-fg)]">Hétköznapok</p>
                  <p className="text-xs text-[var(--th-fg-muted)]">Hétfő – Péntek</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleDay(availWeekdays, setAvailWeekdays)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    availWeekdays.length > 0 ? "bg-[var(--th-accent)]" : "bg-[var(--th-border)]"
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${availWeekdays.length > 0 ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
              {availWeekdays.length > 0 && (
                <div className="space-y-1 pl-1">
                  {TIME_PARTS.map((tp) => (
                    <label key={tp.value} className="flex items-center gap-3 py-1.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={availWeekdays.includes(tp.value)}
                        onChange={() => togglePeriod(tp.value, availWeekdays, setAvailWeekdays)}
                        className="w-4 h-4 rounded accent-[var(--th-accent)] cursor-pointer"
                      />
                      <span className="text-sm text-[var(--th-fg)] group-hover:text-[var(--th-accent)] transition-colors">
                        {tp.label}
                        <span className="text-[var(--th-fg-muted)] ml-1.5 text-xs">{tp.sub}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-[var(--th-border)]" />

            {/* Weekends — edit */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--th-fg)]">Hétvége</p>
                  <p className="text-xs text-[var(--th-fg-muted)]">Szombat – Vasárnap</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleDay(availWeekends, setAvailWeekends)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    availWeekends.length > 0 ? "bg-[var(--th-accent)]" : "bg-[var(--th-border)]"
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${availWeekends.length > 0 ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
              {availWeekends.length > 0 && (
                <div className="space-y-1 pl-1">
                  {TIME_PARTS.map((tp) => (
                    <label key={tp.value} className="flex items-center gap-3 py-1.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={availWeekends.includes(tp.value)}
                        onChange={() => togglePeriod(tp.value, availWeekends, setAvailWeekends)}
                        className="w-4 h-4 rounded accent-[var(--th-accent)] cursor-pointer"
                      />
                      <span className="text-sm text-[var(--th-fg)] group-hover:text-[var(--th-accent)] transition-colors">
                        {tp.label}
                        <span className="text-[var(--th-fg-muted)] ml-1.5 text-xs">{tp.sub}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={saveGeneral}
                disabled={generalSaving}
                className="bg-[var(--th-accent)] hover:brightness-95 disabled:opacity-50 text-[var(--th-accent-fg)] font-semibold rounded-full px-5 py-2 text-sm transition-all"
              >
                {generalSaving ? "Mentés…" : "Mentés"}
              </button>
              <button
                type="button"
                onClick={cancelGeneralEdit}
                disabled={generalSaving}
                className="px-5 py-2 text-sm font-medium text-[var(--th-fg)] bg-white border border-[var(--th-border)] rounded-full hover:bg-[var(--th-muted)] transition-all disabled:opacity-50"
              >
                Mégse
              </button>
            </div>
          </>
        ) : (
          /* View mode */
          <div className="space-y-3">
            {availWeekdays.length === 0 && availWeekends.length === 0 ? (
              <p className="text-sm text-[var(--th-fg-muted)]">Nincs beállított általános elérhetőség.</p>
            ) : (
              <>
                {availWeekdays.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--th-fg-muted)] mb-1">Hétköznapok</p>
                    <p className="text-sm text-[var(--th-fg)]">
                      {availWeekdays.map((v) => TIME_PARTS.find((t) => t.value === v)?.label).filter(Boolean).join(" · ")}
                    </p>
                  </div>
                )}
                {availWeekends.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--th-fg-muted)] mb-1">Hétvége</p>
                    <p className="text-sm text-[var(--th-fg)]">
                      {availWeekends.map((v) => TIME_PARTS.find((t) => t.value === v)?.label).filter(Boolean).join(" · ")}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Specific time slots */}
      <div>
        <h2 className="font-semibold text-[var(--th-fg)] mb-1">Konkrét idősávok</h2>
        <p className="text-sm text-[var(--th-fg-muted)] mb-4">
          Add meg, hogy melyik napokon és mikor állsz rendelkezésre. A foglalások ezekből az időablakokból generálódnak.
        </p>

        <div className="space-y-3">
          {DAYS.map((dayName, i) => (
            <div key={i} className="bg-white border border-[var(--th-border)] rounded-xl p-4">
              <p className="font-medium text-[var(--th-fg)] mb-2">{dayName}</p>
              {byDay[i]?.length > 0 ? (
                <div className="space-y-1">
                  {byDay[i].map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <span className="text-[var(--th-fg)]">{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}</span>
                      <button
                        onClick={() => deleteSlot(s.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Törlés
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--th-fg-muted)] text-sm">Nincs beállított idősáv</p>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white border border-[var(--th-border)] rounded-xl p-4 space-y-3 mt-3">
          <h3 className="font-semibold text-[var(--th-fg)]">Új idősáv hozzáadása</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--th-fg)] mb-1">Nap</label>
              <select
                value={newSlot.displayDay}
                onChange={(e) => setNewSlot((p) => ({ ...p, displayDay: Number(e.target.value) }))}
                className={inputClass}
              >
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--th-fg)] mb-1">Kezdés</label>
              <input
                type="time"
                value={newSlot.start_time}
                onChange={(e) => setNewSlot((p) => ({ ...p, start_time: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--th-fg)] mb-1">Befejezés</label>
              <input
                type="time"
                value={newSlot.end_time}
                onChange={(e) => setNewSlot((p) => ({ ...p, end_time: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}
          <button
            onClick={addSlot}
            disabled={saving}
            className="bg-[var(--th-accent)] hover:brightness-95 disabled:opacity-50 text-[var(--th-accent-fg)] font-semibold rounded-full px-4 py-2 text-sm transition-all"
          >
            {saving ? "Mentés…" : "Hozzáadás"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass = "w-full border border-[var(--th-border)] rounded-xl px-3 py-2 text-sm bg-white text-[var(--th-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--th-accent)]";
