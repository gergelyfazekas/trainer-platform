"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { X, Pencil, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PhotoUpload } from "@/components/photo-upload";
import { GalleryUpload } from "@/components/gallery-upload";
import { CertificateUpload } from "@/components/certificate-upload";
import { hu } from "@/messages/hu";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Update"] & { id?: string };
type GymLocation = { id: string; name: string; city: string | null; postal_code: string | null; street_address: string | null };

const LANGUAGES = [
  "Magyar", "Angol", "Német", "Francia", "Spanyol", "Olasz",
  "Orosz", "Portugál", "Román", "Szerb", "Horvát", "Szlovák",
  "Ukrán", "Kínai", "Japán", "Arab",
];

const HUNGARIAN_COUNTIES = [
  "Bács-Kiskun", "Baranya", "Békés", "Borsod-Abaúj-Zemplén", "Csongrád-Csanád",
  "Fejér", "Győr-Moson-Sopron", "Hajdú-Bihar", "Heves", "Jász-Nagykun-Szolnok",
  "Komárom-Esztergom", "Nógrád", "Pest", "Somogy", "Szabolcs-Szatmár-Bereg",
  "Tolna", "Vas", "Veszprém", "Zala", "Budapest",
];


export default function ProfilePage() {
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "1";

  const [profile, setProfile] = useState<Profile>({});
  const [profileSnapshot, setProfileSnapshot] = useState<Profile>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [gymLocations, setGymLocations] = useState<GymLocation[]>([]);
  const [showGymForm, setShowGymForm] = useState(false);
  const [gymForm, setGymForm] = useState({ name: "", city: "", postal_code: "", street_address: "" });
  const [editingGymId, setEditingGymId] = useState<string | null>(null);
  const [editGymForm, setEditGymForm] = useState({ name: "", city: "", postal_code: "", street_address: "" });
  const [certUrl, setCertUrl] = useState<string | null>(null);
  const [certStatus, setCertStatus] = useState("none");
  const [plan, setPlan] = useState<string | null>(null);
  const [editing, setEditing] = useState(isOnboarding);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setProfileSnapshot(data);
        const raw = data as Record<string, unknown>;
        setCertUrl((raw.certificate_url as string | null) ?? null);
        setCertStatus((raw.certificate_status as string | null) ?? "none");
      }

      const { data: gymData } = await supabase
        .from("trainer_gym_locations")
        .select("id, name, city, postal_code, street_address")
        .eq("trainer_id", user.id)
        .order("created_at");
      if (gymData) setGymLocations(gymData);

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("trainer_id", user.id)
        .maybeSingle();
      const isActiveSub = sub?.status === "active" || sub?.status === "trialing";
      setPlan(isActiveSub ? (sub?.plan ?? null) : null);

      setLoading(false);
    }
    load();
  }, []);

  function enterEdit() {
    setProfileSnapshot(profile);
    setEditing(true);
    setError(null);
  }

  function cancelEdit() {
    setProfile(profileSnapshot);
    setEditing(false);
    setShowGymForm(false);
    setGymForm({ name: "", city: "", postal_code: "", street_address: "" });
    setError(null);
  }

  function setField<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  async function addGym() {
    const name = gymForm.name.trim();
    if (!name || !userId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("trainer_gym_locations")
      .insert({
        trainer_id: userId,
        name,
        city: gymForm.city.trim() || null,
        postal_code: gymForm.postal_code.trim() || null,
        street_address: gymForm.street_address.trim() || null,
      })
      .select("id, name, city, postal_code, street_address")
      .single();
    if (!error && data) {
      setGymLocations((prev) => [...prev, data]);
      setGymForm({ name: "", city: "", postal_code: "", street_address: "" });
      setShowGymForm(false);
    }
  }

  async function updateGym(id: string) {
    const name = editGymForm.name.trim();
    if (!name) return;
    const city = editGymForm.city.trim() || null;
    const postal_code = editGymForm.postal_code.trim() || null;
    const street_address = editGymForm.street_address.trim() || null;
    const supabase = createClient();
    const { error } = await supabase
      .from("trainer_gym_locations")
      .update({ name, city, postal_code, street_address })
      .eq("id", id);
    if (!error) {
      setGymLocations((prev) =>
        prev.map((g) => g.id === id ? { ...g, name, city, postal_code, street_address } : g)
      );
      setEditingGymId(null);
    }
  }

  async function removeGym(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("trainer_gym_locations").delete().eq("id", id);
    if (!error) setGymLocations((prev) => prev.filter((g) => g.id !== id));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const maxPhotos = plan === "featured" ? 15 : 5;
    const galleryPhotos = (profile.gallery_photos ?? []).slice(0, maxPhotos);

    const { error: saveError } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        bio: profile.bio,
        city: profile.city,
        county: profile.county,
        business_name: profile.business_name,
        tax_id: profile.tax_id,
        hourly_rate: profile.hourly_rate,
        profile_photo: profile.profile_photo,
        specialties: profile.specialties,
        languages: profile.languages,
        gallery_photos: galleryPhotos,
        phone: profile.phone ?? null,
      })
      .eq("id", userId);

    if (saveError) {
      setError(saveError.message);
    } else {
      setProfileSnapshot(profile);
      setEditing(false);
      setShowGymForm(false);
      setGymForm({ name: "", city: "", postal_code: "", street_address: "" });
      setSuccess(hu.dashboard.saveSuccess);
      setTimeout(() => setSuccess(null), 4000);
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="text-[var(--th-fg-muted)] text-sm">Betöltés…</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--th-fg)]">{hu.dashboard.profile}</h1>
        {!editing && (
          <button
            type="button"
            onClick={enterEdit}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[var(--th-fg)] bg-white border border-[var(--th-border)] rounded-full hover:bg-[var(--th-muted)] transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
            Szerkesztés
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="space-y-6">
          {userId && (
            <PhotoUpload
              userId={userId}
              currentUrl={profile.profile_photo ?? null}
              onUpload={async (url) => {
                setField("profile_photo", url);
                const supabase = createClient();
                await supabase.from("profiles").update({ profile_photo: url }).eq("id", userId);
              }}
              label="Profilfotó"
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Teljes név">
              <input
                type="text"
                value={profile.full_name ?? ""}
                onChange={(e) => setField("full_name", e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Vállalkozás neve (számlázáshoz)">
              <input
                type="text"
                value={profile.business_name ?? ""}
                onChange={(e) => setField("business_name", e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Adószám (ÁFA-számla)">
              <input
                type="text"
                value={profile.tax_id ?? ""}
                onChange={(e) => setField("tax_id", e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Óradíj (Ft)">
              <input
                type="number"
                min={0}
                value={profile.hourly_rate ?? ""}
                onChange={(e) =>
                  setField("hourly_rate", e.target.value ? Number(e.target.value) : null)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Telefonszám">
              <input
                type="tel"
                value={profile.phone ?? ""}
                onChange={(e) => setField("phone", e.target.value || null)}
                placeholder="+36 20 000 0000"
                className={inputClass}
              />
            </Field>

            <Field label="Város">
              <input
                type="text"
                value={profile.city ?? ""}
                onChange={(e) => setField("city", e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Megye">
              <select
                value={profile.county ?? ""}
                onChange={(e) => setField("county", e.target.value)}
                className={inputClass}
              >
                <option value="">Válassz megyét…</option>
                {HUNGARIAN_COUNTIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Bemutatkozás">
            <textarea
              rows={5}
              value={profile.bio ?? ""}
              onChange={(e) => setField("bio", e.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="col-span-2">
            <p className="text-sm font-medium text-[var(--th-fg)] mb-2">Szakterületek</p>
            <SpecialtiesSelect
              selected={profile.specialties ?? []}
              onChange={(vals) => setField("specialties", vals)}
            />
          </div>

          <div className="col-span-2">
            <p className="text-sm font-medium text-[var(--th-fg)] mb-2">Beszélt nyelvek</p>
            <LanguageSelect
              selected={profile.languages ?? []}
              onChange={(langs) => setField("languages", langs)}
            />
          </div>

          <div className="col-span-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[var(--th-fg)]">Galéria</p>
              <p className="text-xs text-[var(--th-fg-muted)]">
                Max. {plan === "featured" ? 15 : 5} fotó ({plan === "featured" ? "Kiemelt" : "Basic"} csomag)
              </p>
            </div>
            {userId && (
              <GalleryUpload
                userId={userId}
                photos={profile.gallery_photos ?? []}
                onChange={(urls) => setField("gallery_photos", urls)}
              />
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--th-fg)] mb-2">Edzőterem helyszínek</p>
            <div className="space-y-2 mb-3">
              {gymLocations.map((g) =>
                editingGymId === g.id ? (
                  <div key={g.id} className="space-y-2 p-3 border border-[var(--th-accent)] rounded-xl bg-[var(--th-muted)]">
                    <input
                      type="text"
                      placeholder="Edzőterem neve *"
                      value={editGymForm.name}
                      onChange={(e) => setEditGymForm((f) => ({ ...f, name: e.target.value }))}
                      className={inputClass}
                      autoFocus
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Irányítószám"
                        value={editGymForm.postal_code}
                        onChange={(e) => setEditGymForm((f) => ({ ...f, postal_code: e.target.value }))}
                        className={inputClass}
                      />
                      <input
                        type="text"
                        placeholder="Város"
                        value={editGymForm.city}
                        onChange={(e) => setEditGymForm((f) => ({ ...f, city: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Cím"
                      value={editGymForm.street_address}
                      onChange={(e) => setEditGymForm((f) => ({ ...f, street_address: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), updateGym(g.id))}
                      className={inputClass}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateGym(g.id)}
                        className="px-3 py-2 text-sm bg-[var(--th-accent)] hover:brightness-95 text-[var(--th-accent-fg)] rounded-full"
                      >
                        Mentés
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingGymId(null)}
                        className="px-3 py-2 text-sm bg-white hover:bg-[var(--th-muted)] rounded-full border border-[var(--th-border)]"
                      >
                        Mégse
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={g.id} className="flex items-start justify-between p-3 bg-[var(--th-bg)] border border-[var(--th-border)] rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-[var(--th-fg)]">{g.name}</p>
                      {(g.postal_code || g.city) && (
                        <p className="text-xs text-[var(--th-fg-muted)] mt-0.5">{[g.postal_code, g.city].filter(Boolean).join(" ")}</p>
                      )}
                      {g.street_address && <p className="text-xs text-[var(--th-fg-muted)]">{g.street_address}</p>}
                    </div>
                    <div className="flex gap-1 ml-3 mt-0.5">
                      <button
                        type="button"
                        onClick={() => { setEditingGymId(g.id); setEditGymForm({ name: g.name, city: g.city ?? "", postal_code: g.postal_code ?? "", street_address: g.street_address ?? "" }); }}
                        className="text-[var(--th-fg-muted)] hover:text-[var(--th-accent)]"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeGym(g.id)}
                        className="text-[var(--th-fg-muted)] hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {showGymForm ? (
              <div className="space-y-2 p-3 border border-[var(--th-border)] rounded-xl bg-[var(--th-bg)]">
                <input
                  type="text"
                  placeholder="Edzőterem neve *"
                  value={gymForm.name}
                  onChange={(e) => setGymForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputClass}
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Irányítószám"
                    value={gymForm.postal_code}
                    onChange={(e) => setGymForm((f) => ({ ...f, postal_code: e.target.value }))}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Város"
                    value={gymForm.city}
                    onChange={(e) => setGymForm((f) => ({ ...f, city: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Cím"
                  value={gymForm.street_address}
                  onChange={(e) => setGymForm((f) => ({ ...f, street_address: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGym())}
                  className={inputClass}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addGym}
                    className="px-3 py-2 text-sm bg-[var(--th-accent)] hover:brightness-95 text-[var(--th-accent-fg)] rounded-full"
                  >
                    Hozzáad
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowGymForm(false); setGymForm({ name: "", city: "", postal_code: "", street_address: "" }); }}
                    className="px-3 py-2 text-sm bg-white hover:bg-[var(--th-muted)] rounded-full border border-[var(--th-border)]"
                  >
                    Mégse
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowGymForm(true)}
                className="text-sm text-[var(--th-accent)] hover:underline"
              >
                + Edzőterem hozzáadása
              </button>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-[var(--th-accent)] hover:brightness-95 disabled:opacity-50 text-[var(--th-accent-fg)] font-semibold rounded-full px-5 py-2 transition-all"
            >
              {saving ? "Mentés…" : "Mentés"}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-[var(--th-fg)] bg-white border border-[var(--th-border)] rounded-full hover:bg-[var(--th-muted)] transition-all disabled:opacity-50"
            >
              Mégse
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {profile.profile_photo && (
            <Image
              src={profile.profile_photo}
              alt="Profilfotó"
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover border border-[var(--th-border)]"
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <ViewField label="Teljes név" value={profile.full_name} />
            <ViewField label="Vállalkozás neve" value={profile.business_name} />
            <ViewField label="Adószám" value={profile.tax_id} />
            <ViewField label="Óradíj" value={profile.hourly_rate != null ? `${profile.hourly_rate} Ft` : null} />
            <ViewField label="Város" value={profile.city} />
            <ViewField label="Megye" value={profile.county} />
          </div>

          {profile.bio && (
            <div>
              <p className="text-sm font-medium text-[var(--th-fg-muted)] mb-1">Bemutatkozás</p>
              <p className="text-sm text-[var(--th-fg)] whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {profile.specialties && profile.specialties.length > 0 && (
            <div>
              <p className="text-sm font-medium text-[var(--th-fg-muted)] mb-2">Szakterületek</p>
              <div className="flex flex-wrap gap-2">
                {profile.specialties.map((s) => (
                  <span key={s} className="text-sm px-3 py-1 rounded-full bg-[var(--th-muted)] text-[var(--th-fg)] border border-[var(--th-border)]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.languages && profile.languages.length > 0 && (
            <div>
              <p className="text-sm font-medium text-[var(--th-fg-muted)] mb-2">Beszélt nyelvek</p>
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((lang) => (
                  <span key={lang} className="text-sm px-3 py-1 rounded-full bg-[var(--th-muted)] text-[var(--th-fg)] border border-[var(--th-border)]">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}



          {profile.gallery_photos && profile.gallery_photos.length > 0 && (
            <div>
              <p className="text-sm font-medium text-[var(--th-fg-muted)] mb-2">Galéria</p>
              <div className="grid grid-cols-3 gap-2">
                {profile.gallery_photos.map((url, i) => (
                  <div key={i} className="relative h-28 rounded-xl overflow-hidden border border-[var(--th-border)]">
                    <Image src={url} alt="" fill className="object-cover" sizes="(max-width: 768px) 33vw, 200px" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {gymLocations.length > 0 && (
            <div>
              <p className="text-sm font-medium text-[var(--th-fg-muted)] mb-2">Edzőterem helyszínek</p>
              <div className="space-y-2">
                {gymLocations.map((g) => (
                  <div key={g.id} className="p-3 bg-[var(--th-bg)] border border-[var(--th-border)] rounded-xl">
                    <p className="text-sm font-medium text-[var(--th-fg)]">{g.name}</p>
                    {(g.postal_code || g.city) && (
                      <p className="text-xs text-[var(--th-fg-muted)] mt-0.5">{[g.postal_code, g.city].filter(Boolean).join(" ")}</p>
                    )}
                    {g.street_address && <p className="text-xs text-[var(--th-fg-muted)]">{g.street_address}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Certificate — always visible, independent of edit mode */}
      {userId && (
        <div className="mt-6 pt-6 border-t border-[var(--th-border)]">
          <CertificateUpload
            userId={userId}
            currentUrl={certUrl}
            currentStatus={certStatus}
          />
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full border border-[var(--th-border)] rounded-xl px-3 py-2 text-sm bg-white text-[var(--th-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--th-accent)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="col-span-2 sm:col-span-1">
      <label className="block text-sm font-medium text-[var(--th-fg)] mb-1">{label}</label>
      {children}
    </div>
  );
}

function ViewField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="col-span-2 sm:col-span-1">
      <p className="text-sm font-medium text-[var(--th-fg-muted)] mb-0.5">{label}</p>
      <p className="text-sm text-[var(--th-fg)]">{value}</p>
    </div>
  );
}

const PREDEFINED_SPECIALTIES = [
  "Erőnléti edzés", "Funkcionális edzés", "Súlyzós edzés", "Kardió edzés",
  "HIIT", "CrossFit", "Calisthenics", "Yoga", "Pilates", "Nyújtás és mobilitás",
  "Futás", "Kerékpározás", "Úszás", "Box / Kickbox", "Harcművészetek",
  "Testépítés", "Fogyás / Zsírégetés", "Tömegnövelés",
  "Rehabilitációs edzés", "Sérülés utáni felépülés",
  "Várandós edzés", "Időseknek szóló edzés", "Gyerekek edzése",
  "Csoportos edzés", "Online edzés", "Táplálkozási tanácsadás",
];

function SpecialtiesSelect({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const [customInput, setCustomInput] = useState("");

  function toggle(val: string) {
    onChange(selected.includes(val) ? selected.filter((s) => s !== val) : [...selected, val]);
  }

  function addCustom() {
    const val = customInput.trim();
    if (!val || selected.includes(val)) return;
    onChange([...selected, val]);
    setCustomInput("");
  }

  return (
    <div className="space-y-3">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[var(--th-accent)] text-white">
              {s}
              <button type="button" onClick={() => toggle(s)} className="hover:opacity-75">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Predefined grid */}
      <div className="flex flex-wrap gap-1.5 p-3 border border-[var(--th-border)] rounded-xl bg-white max-h-48 overflow-y-auto">
        {PREDEFINED_SPECIALTIES.map((s) => {
          const active = selected.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                active
                  ? "bg-[var(--th-accent)] text-white border-[var(--th-accent)]"
                  : "bg-white text-[var(--th-fg)] border-[var(--th-border)] hover:border-[var(--th-accent)] hover:text-[var(--th-accent)]"
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>

      {/* Custom entry */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
          placeholder="Egyéni szakág hozzáadása…"
          className={inputClass}
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customInput.trim()}
          className="shrink-0 px-4 py-2 text-sm font-medium bg-[var(--th-muted)] hover:bg-[var(--th-border)] disabled:opacity-40 text-[var(--th-fg)] rounded-xl border border-[var(--th-border)] transition-colors"
        >
          Hozzáad
        </button>
      </div>
    </div>
  );
}

function LanguageSelect({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggle(lang: string) {
    onChange(selected.includes(lang) ? selected.filter((l) => l !== lang) : [...selected, lang]);
  }

  return (
    <div ref={ref} className="relative">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selected.map((lang) => (
            <span key={lang} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[var(--th-muted)] text-[var(--th-fg)] border border-[var(--th-border)]">
              {lang}
              <button type="button" onClick={() => toggle(lang)} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between border border-[var(--th-border)] rounded-xl px-3 py-2.5 text-sm bg-white text-left hover:border-[var(--th-accent)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--th-accent)]"
      >
        <span className={selected.length === 0 ? "text-[var(--th-fg-muted)]" : "text-[var(--th-fg)]"}>
          {selected.length === 0 ? "Válassz nyelvet…" : `${selected.length} nyelv kiválasztva`}
        </span>
        <ChevronDown className={`w-4 h-4 text-[var(--th-fg-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-[var(--th-border)] rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {LANGUAGES.map((lang) => (
            <li
              key={lang}
              onMouseDown={(e) => { e.preventDefault(); toggle(lang); }}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--th-fg)] hover:bg-[var(--th-muted)] cursor-pointer"
            >
              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected.includes(lang) ? "bg-[var(--th-accent)] border-[var(--th-accent)]" : "border-[var(--th-border)]"}`}>
                {selected.includes(lang) && (
                  <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                )}
              </span>
              {lang}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
