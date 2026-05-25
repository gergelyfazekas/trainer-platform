"use client";

import { useEffect, useState } from "react";
import { Pencil, X, ChevronUp, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { hu } from "@/messages/hu";
import type { Database } from "@/types/database";

type Package = Database["public"]["Tables"]["packages"]["Row"];
type PackageForm = {
  name: string;
  description: string;
  price: string;
  sessions: string;
  duration_min: string;
  is_popular: boolean;
};

const EMPTY_FORM: PackageForm = {
  name: "",
  description: "",
  price: "",
  sessions: "",
  duration_min: "",
  is_popular: false,
};

const HU_FT = (n: number) => new Intl.NumberFormat("hu-HU").format(n) + " Ft";

function formatDuration(pkg: Package) {
  const parts: string[] = [];
  if (pkg.sessions && pkg.sessions > 1) parts.push(`${pkg.sessions} alkalom`);
  if (pkg.duration_min) parts.push(`${pkg.duration_min} perc`);
  return parts.join(" · ") || null;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PackageForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("packages")
        .select("*")
        .eq("trainer_id", user.id)
        .order("sort_order")
        .order("created_at");
      setPackages(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function setField<K extends keyof PackageForm>(key: K, value: PackageForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startEdit(pkg: Package) {
    setEditingId(pkg.id);
    setForm({
      name: pkg.name,
      description: pkg.description ?? "",
      price: String(pkg.price),
      sessions: pkg.sessions != null ? String(pkg.sessions) : "",
      duration_min: pkg.duration_min != null ? String(pkg.duration_min) : "",
      is_popular: pkg.is_popular,
    });
    setShowForm(true);
    setError(null);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !form.name.trim()) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: form.price ? Number(form.price) : 0,
      sessions: form.sessions ? Number(form.sessions) : null,
      duration_min: form.duration_min ? Number(form.duration_min) : null,
      is_popular: form.is_popular,
    };

    let saved = false;
    if (editingId) {
      const { data, error: err } = await supabase
        .from("packages")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();
      if (err) { setError(err.message); }
      else if (data) { setPackages((prev) => prev.map((p) => p.id === editingId ? data : p)); saved = true; }
    } else {
      const { data, error: err } = await supabase
        .from("packages")
        .insert({ ...payload, trainer_id: userId, sort_order: packages.length })
        .select()
        .single();
      if (err) { setError(err.message); }
      else if (data) { setPackages((prev) => [...prev, data]); saved = true; }
    }

    if (saved) {
      cancelForm();
      setSuccess(hu.dashboard.saveSuccess);
      setTimeout(() => setSuccess(null), 4000);
    }
    setSaving(false);
  }

  async function move(index: number, dir: -1 | 1) {
    const swapIndex = index + dir;
    if (swapIndex < 0 || swapIndex >= packages.length) return;

    const reordered = [...packages];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    const updated = reordered.map((p, i) => ({ ...p, sort_order: i }));
    setPackages(updated);

    const supabase = createClient();
    await Promise.all([
      supabase.from("packages").update({ sort_order: swapIndex }).eq("id", packages[index].id),
      supabase.from("packages").update({ sort_order: index }).eq("id", packages[swapIndex].id),
    ]);
  }

  async function deletePackage(id: string) {
    const supabase = createClient();
    const { error: err } = await supabase.from("packages").delete().eq("id", id);
    if (!err) setPackages((prev) => prev.filter((p) => p.id !== id));
    setConfirmDeleteId(null);
  }

  if (loading) return <div className="text-[var(--th-fg-muted)] text-sm">Betöltés…</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--th-fg)]">Csomagok</h1>
          <p className="text-sm text-[var(--th-fg-muted)] mt-1">
            Add meg az edzési csomagjaidat és áraidat. Ezek megjelennek a nyilvános profiloldaladon.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }}
            className="shrink-0 bg-[var(--th-accent)] hover:brightness-95 text-[var(--th-accent-fg)] text-sm font-semibold rounded-full px-4 py-2 transition-all"
          >
            + Új csomag
          </button>
        )}
      </div>

      {success && <p className="text-green-600 text-sm">{success}</p>}

      {/* Package list */}
      {packages.length > 0 && (
        <div className="space-y-3">
          {packages.map((pkg, index) => (
            <div
              key={pkg.id}
              className="bg-white border border-[var(--th-border)] rounded-xl p-4 flex items-start gap-3"
            >
              <div className="flex flex-col gap-0.5 shrink-0 mt-0.5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="text-[var(--th-fg-muted)] hover:text-[var(--th-fg)] disabled:opacity-20 transition-colors"
                  aria-label="Feljebb"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === packages.length - 1}
                  className="text-[var(--th-fg-muted)] hover:text-[var(--th-fg)] disabled:opacity-20 transition-colors"
                  aria-label="Lejjebb"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-[var(--th-fg)] text-sm">{pkg.name}</p>
                  {pkg.is_popular && (
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-[var(--th-accent)] text-white px-2 py-0.5 rounded-full">
                      Népszerű
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-[var(--th-fg)] mt-1">
                  {pkg.price === 0 ? "Ingyenes" : HU_FT(pkg.price)}
                  {pkg.sessions && pkg.sessions > 1 && (
                    <span className="text-[var(--th-fg-muted)] font-normal ml-1.5">
                      · {HU_FT(Math.round(pkg.price / pkg.sessions))} / alkalom
                    </span>
                  )}
                </p>
                {formatDuration(pkg) && (
                  <p className="text-xs text-[var(--th-fg-muted)] mt-0.5">{formatDuration(pkg)}</p>
                )}
                {pkg.description && (
                  <p className="text-xs text-[var(--th-fg-muted)] mt-1 leading-relaxed">{pkg.description}</p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(pkg)}
                  className="text-[var(--th-fg-muted)] hover:text-[var(--th-accent)] transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(pkg.id)}
                  className="text-[var(--th-fg-muted)] hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {packages.length === 0 && !showForm && (
        <div className="bg-white border border-[var(--th-border)] rounded-xl p-8 text-center text-[var(--th-fg-muted)] text-sm">
          Még nincs csomag. Kattints az „Új csomag" gombra az első hozzáadásához.
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[var(--th-border)] rounded-xl p-5 space-y-4"
        >
          <h2 className="font-semibold text-[var(--th-fg)]">
            {editingId ? "Csomag szerkesztése" : "Új csomag"}
          </h2>

          <div>
            <label className="block text-sm font-medium text-[var(--th-fg)] mb-1">
              Csomag neve <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="pl. 10 alkalmas bérlet"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--th-fg)] mb-1">Leírás</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Rövid leírás, mi szerepel a csomagban…"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--th-fg)] mb-1">
                Ár (Ft) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                required
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--th-fg)] mb-1">Alkalmak száma</label>
              <input
                type="number"
                min={1}
                value={form.sessions}
                onChange={(e) => setField("sessions", e.target.value)}
                placeholder="pl. 10"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--th-fg)] mb-1">Időtartam (perc)</label>
              <input
                type="number"
                min={1}
                value={form.duration_min}
                onChange={(e) => setField("duration_min", e.target.value)}
                placeholder="pl. 60"
                className={inputClass}
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_popular}
              onChange={(e) => setField("is_popular", e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--th-accent)]"
            />
            <span className="text-sm text-[var(--th-fg)]">Megjelölés „Népszerű" csomagként</span>
          </label>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="bg-[var(--th-accent)] hover:brightness-95 disabled:opacity-50 text-[var(--th-accent-fg)] font-semibold rounded-full px-5 py-2 text-sm transition-all"
            >
              {saving ? "Mentés…" : editingId ? "Mentés" : "Hozzáadás"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-[var(--th-fg)] bg-white border border-[var(--th-border)] rounded-full hover:bg-[var(--th-muted)] transition-all disabled:opacity-50"
            >
              Mégse
            </button>
          </div>
        </form>
      )}
      {confirmDeleteId && (
        <ConfirmDialog
          message="Biztosan törölni szeretnéd ezt a csomagot? Ez a művelet nem vonható vissza."
          onConfirm={() => deletePackage(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}

const inputClass =
  "w-full border border-[var(--th-border)] rounded-xl px-3 py-2 text-sm bg-white text-[var(--th-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--th-accent)] placeholder:text-[var(--th-fg-muted)]";
