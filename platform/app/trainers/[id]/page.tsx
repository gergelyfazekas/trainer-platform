import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScrollHeader } from "@/components/trainer-profile/scroll-header";
import { BookingCard } from "@/components/trainer-profile/booking-card";
import { GalleryCarousel } from "@/components/trainer-profile/gallery-carousel";
import { MobileBar } from "@/components/trainer-profile/mobile-bar";
import { GymMapWrapper } from "@/components/trainer-profile/gym-map-wrapper";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: trainer } = await supabase
    .from("profiles")
    .select("full_name, bio, city, county, profile_photo")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!trainer) return { title: "Edző nem található – foglalj edzőt" };

  const location = [trainer.city, trainer.county].filter(Boolean).join(", ");
  const title = location
    ? `${trainer.full_name} – személyi edző, ${location} | foglalj edzőt`
    : `${trainer.full_name} – személyi edző | foglalj edzőt`;
  const description =
    trainer.bio?.slice(0, 155) ??
    `${trainer.full_name} személyi edző profilja a foglalj edzőt platformon.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: trainer.profile_photo ? [{ url: trainer.profile_photo }] : [],
    },
  };
}

const LANGUAGE_FLAGS: Record<string, string> = {
  Magyar: "🇭🇺",
  Angol: "🇬🇧",
  Német: "🇩🇪",
  Francia: "🇫🇷",
  Spanyol: "🇪🇸",
  Olasz: "🇮🇹",
  Portugál: "🇵🇹",
  Orosz: "🇷🇺",
  Kínai: "🇨🇳",
  Japán: "🇯🇵",
  Arab: "🇸🇦",
  Holland: "🇳🇱",
  Lengyel: "🇵🇱",
  Cseh: "🇨🇿",
  Román: "🇷🇴",
  Szlovák: "🇸🇰",
};

function Section({
  id,
  title,
  eyebrow,
  children,
}: {
  id?: string;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-t border-[var(--th-border)] py-10">
      {eyebrow && (
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--th-accent)] mb-1.5">
          {eyebrow}
        </p>
      )}
      <h2 className="text-[26px] font-bold text-[var(--th-fg)] tracking-tight mb-6">{title}</h2>
      {children}
    </section>
  );
}

const HU_FT = (n: number) =>
  new Intl.NumberFormat("hu-HU").format(n) + " Ft";

export default async function TrainerProfilePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const lookahead = new Date();
  lookahead.setDate(lookahead.getDate() + 28);

  const { data: { user } } = await supabase.auth.getUser();
  let userInitial: string | null = null;
  if (user) {
    const { data: myProfile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
    const name = myProfile?.full_name ?? user.email ?? "";
    userInitial = name.charAt(0).toUpperCase() || null;
  }

  const [{ data: trainer }, { data: gymRows }, { data: availSlots }, { data: existingBookings }, { data: pkgRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).eq("is_active", true).single(),
    supabase.from("trainer_gym_locations").select("name, city, postal_code, street_address").eq("trainer_id", id),
    supabase.from("availability_slots").select("day_of_week, start_time, end_time").eq("trainer_id", id),
    supabase
      .from("bookings")
      .select("appointment_at, duration_min")
      .eq("trainer_id", id)
      .neq("status", "cancelled")
      .gte("appointment_at", new Date().toISOString())
      .lte("appointment_at", lookahead.toISOString()),
    supabase.from("packages").select("*").eq("trainer_id", id).order("sort_order").order("created_at"),
  ]);

  if (!trainer) notFound();

  // Generate the first 6 free 60-min slots within the next 28 days
  const nearestSlots: string[] = [];
  const now = new Date();
  for (let dayOffset = 0; dayOffset < 28 && nearestSlots.length < 6; dayOffset++) {
    const date = new Date(now);
    date.setDate(now.getDate() + dayOffset);
    const dow = date.getDay(); // 0=Sun

    for (const slot of (availSlots ?? []).filter((s) => s.day_of_week === dow)) {
      const [sh, sm] = slot.start_time.split(":").map(Number);
      const [eh, em] = slot.end_time.split(":").map(Number);
      let cursor = sh * 60 + sm;
      const end = eh * 60 + em;

      while (cursor + 60 <= end && nearestSlots.length < 6) {
        const slotStart = new Date(date);
        slotStart.setHours(Math.floor(cursor / 60), cursor % 60, 0, 0);

        if (slotStart > now) {
          const conflicted = (existingBookings ?? []).some((b) => {
            const bStart = new Date(b.appointment_at).getTime();
            const bEnd = bStart + (b.duration_min ?? 60) * 60000;
            const sStart = slotStart.getTime();
            const sEnd = sStart + 60 * 60000;
            return sStart < bEnd && sEnd > bStart;
          });
          if (!conflicted) nearestSlots.push(slotStart.toISOString());
        }
        cursor += 60;
      }
    }
  }

  const location = [trainer.city, trainer.county].filter(Boolean).join(", ");
  const galleries = trainer.gallery_photos ?? [];
  const languages = trainer.languages ?? [];
  const specialties = trainer.specialties ?? [];
  const gymLocations = gymRows ?? [];
  const packages = pkgRows ?? [];

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://foglaljedzot.hu";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: trainer.full_name,
    description: trainer.bio ?? undefined,
    jobTitle: "Személyi edző",
    url: `${baseUrl}/trainers/${trainer.id}`,
    image: trainer.profile_photo ?? undefined,
    address: (trainer.city || trainer.county)
      ? {
          "@type": "PostalAddress",
          addressLocality: trainer.city ?? undefined,
          addressRegion: trainer.county ?? undefined,
          addressCountry: "HU",
        }
      : undefined,
    knowsAbout: specialties.length > 0 ? specialties : undefined,
  };

  return (
    <div className="min-h-screen bg-[var(--th-bg)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ScrollHeader trainerName={trainer.full_name ?? ""} userInitial={userInitial} />

      {/* Page body: single outer grid so booking card aligns with the hero */}
      <div className="max-w-[1280px] mx-auto px-6 pt-2 pb-24 md:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-12">

          {/* LEFT — back link + hero + content sections */}
          <div>
            <a
              href="/trainers"
              className="inline-flex items-center gap-1.5 text-[13px] text-[var(--th-fg-muted)] hover:text-[var(--th-fg)] transition-colors mb-5"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Vissza a keresési eredményekhez
            </a>

            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 md:gap-8 items-center pb-6">
              {/* Portrait */}
              <div className="relative w-[200px] sm:w-[240px] md:w-full aspect-[4/5] rounded-[20px] overflow-hidden bg-[var(--th-muted)] shrink-0">
                {trainer.profile_photo ? (
                  <Image
                    src={trainer.profile_photo}
                    alt={trainer.full_name ?? ""}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 240px, 260px"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-6xl text-[var(--th-fg-muted)]">
                    👤
                  </div>
                )}
                {trainer.is_featured && (
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/95 backdrop-blur text-[var(--th-fg)] text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--th-accent)]" />
                      Kiemelt
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div>
                {location && (
                  <p className="text-[13px] uppercase tracking-[0.18em] font-semibold text-[var(--th-fg-muted)] mb-2.5 inline-flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[var(--th-accent)]" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {location}
                  </p>
                )}
                <h1 className="text-[36px] md:text-[52px] font-bold tracking-tight leading-[1.02] text-[var(--th-fg)]">
                  {trainer.full_name}
                </h1>
                {trainer.certificate_status === "approved" && (
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 shrink-0" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      Ellenőrzött edző
                    </span>
                  </div>
                )}
                {trainer.hourly_rate && (
                  <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-[var(--th-fg)]">
                    <span className="font-semibold text-[18px]">
                      {HU_FT(trainer.hourly_rate)}
                      <span className="text-[14px] font-normal text-[var(--th-fg-muted)] ml-1">/ óra</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Rólam */}
            {(trainer.bio || languages.length > 0 || gymLocations.length > 0 || location) && (
              <Section id="about" title="Rólam" eyebrow="Bemutatkozás">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-8 items-start">
                  <div>
                    {trainer.bio && (
                      <p
                        className="text-[16px] text-[var(--th-fg)] leading-[1.7] whitespace-pre-line"
                        style={{ textWrap: "pretty" } as React.CSSProperties}
                      >
                        {trainer.bio}
                      </p>
                    )}
                  </div>

                  {/* Sidebar facts */}
                  {(languages.length > 0 || gymLocations.length > 0 || location) && (
                    <div className="bg-white border border-[var(--th-border)] rounded-2xl p-5 space-y-4">
                      {languages.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--th-fg-muted)] mb-2">
                            Beszélt nyelvek
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {languages.map((l) => (
                              <span
                                key={l}
                                className="inline-flex items-center gap-1.5 text-[13px] px-2.5 py-1 rounded-full bg-[var(--th-muted)] text-[var(--th-fg)]"
                              >
                                <span>{LANGUAGE_FLAGS[l] ?? "🌐"}</span>
                                {l}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className={languages.length > 0 ? "border-t border-[var(--th-border)] pt-4" : ""}>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--th-fg-muted)] mb-2">
                          Edzés helyszín
                        </p>
                        {gymLocations.length > 0 ? (
                          <ul className="space-y-3">
                            {gymLocations.map((loc, i) => {
                              const address = [loc.postal_code, loc.city, loc.street_address].filter(Boolean).join(" ");
                              return (
                                <li key={i}>
                                  <p className="font-semibold text-[13.5px] text-[var(--th-fg)] leading-snug">{loc.name}</p>
                                  {address && (
                                    <p className="text-[12.5px] text-[var(--th-fg-muted)] mt-0.5 leading-snug">{address}</p>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="text-[13.5px] text-[var(--th-fg)] leading-relaxed">{location}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Szakágak */}
            {specialties.length > 0 && (
              <Section id="specialties" title="Szakterületek" eyebrow="Mit edzünk">
                <div className="flex flex-wrap gap-2">
                  {specialties.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 text-[13px] px-4 py-2 rounded-full bg-[var(--th-muted)] text-[var(--th-fg)] border border-[var(--th-border)]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Fotógaléria */}
            {galleries.length > 0 && (
              <Section id="gallery" title="Fotógaléria" eyebrow={`${galleries.length} fotó`}>
                <GalleryCarousel photos={galleries} />
              </Section>
            )}

            {/* Csomagok */}
            {packages.length > 0 && (
              <Section id="packages" title="Csomagok és árak" eyebrow="Áraink">
                <div className={`grid gap-4 ${packages.length === 1 ? "grid-cols-1" : packages.length === 2 ? "grid-cols-1 sm:grid-cols-2" : packages.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
                  {packages.map((pkg) => {
                    const isFree = pkg.price === 0;
                    const perSession = pkg.sessions
                      ? Math.round(pkg.price / pkg.sessions)
                      : null;
                    const durationLabel = [
                      pkg.sessions ? `${pkg.sessions} alkalom` : null,
                      pkg.duration_min ? `${pkg.duration_min} perc` : null,
                    ].filter(Boolean).join(" · ");
                    return (
                      <div
                        key={pkg.id}
                        className={`relative bg-white border rounded-2xl p-5 ${
                          pkg.is_popular
                            ? "border-[var(--th-accent)] shadow-[0_8px_28px_-12px_rgba(59,130,246,0.3)]"
                            : "border-[var(--th-border)]"
                        }`}
                      >
                        {pkg.is_popular && (
                          <span className="absolute -top-2.5 right-5 bg-[var(--th-accent)] text-white text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full">
                            Népszerű
                          </span>
                        )}
                        <div>
                          {durationLabel && (
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--th-fg-muted)] mb-1.5">
                              {durationLabel}
                            </p>
                          )}
                          <h3 className="text-[17px] font-bold text-[var(--th-fg)] leading-tight">{pkg.name}</h3>
                          <div className="mt-3 flex items-baseline gap-1.5">
                            <span className="text-[26px] font-bold text-[var(--th-fg)] tracking-tight">
                              {isFree ? "Ingyenes" : HU_FT(pkg.price)}
                            </span>
                          </div>
                          {perSession && (
                            <p className="text-[12px] text-[var(--th-fg-muted)] mt-0.5">
                              {HU_FT(perSession)} / alkalom
                            </p>
                          )}
                          {pkg.description && (
                            <p className="text-[13.5px] text-[var(--th-fg-muted)] leading-relaxed mt-3">
                              {pkg.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Edzés helyszínei */}
            {gymLocations.length > 0 && (
              <Section id="locations" title="Edzés helyszínei" eyebrow="Hol találkozunk">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-5">
                  {/* OpenStreetMap */}
                  <div className="aspect-[16/10] md:aspect-auto md:min-h-[280px] rounded-2xl overflow-hidden border border-[var(--th-border)]">
                    <GymMapWrapper locations={gymLocations} />
                  </div>

                  {/* Location list */}
                  <div className="space-y-3">
                    {gymLocations.map((loc, i) => {
                      const address = [loc.postal_code, loc.city, loc.street_address].filter(Boolean).join(" ");
                      return (
                        <div
                          key={i}
                          className="bg-white border border-[var(--th-border)] rounded-2xl p-4 flex items-start gap-3"
                        >
                          <div className="w-10 h-10 rounded-xl bg-[var(--th-muted)] flex items-center justify-center shrink-0">
                            <svg
                              viewBox="0 0 24 24"
                              className="w-5 h-5 text-[var(--th-fg)]"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[14.5px] text-[var(--th-fg)] leading-snug">{loc.name}</p>
                            {address && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[13px] text-[var(--th-fg-muted)] mt-0.5 leading-relaxed hover:text-[var(--th-accent)] hover:underline transition-colors"
                              >
                                {address}
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Section>
            )}

            {/* Final CTA */}
            <section className="mt-12 rounded-3xl bg-[var(--th-fg)] text-white p-8 md:p-12 relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-[var(--th-accent)] opacity-20 blur-3xl pointer-events-none" />
              <div className="relative max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--th-accent)] mb-3 opacity-90">
                  Kezdjük el
                </p>
                <h2 className="text-[32px] md:text-[40px] font-bold leading-[1.05] tracking-tight">
                  Az első konzultáció ingyenes — nézzük meg, illünk-e egymáshoz.
                </h2>
                <p className="mt-4 text-white/70 text-[15px] leading-relaxed">
                  30 perc, kötelezettség nélkül. Megbeszéljük a céljaidat, megnézzük az időbeosztásodat, és kapsz
                  egy egyenes választ arra, hogy tudunk-e együtt dolgozni.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={`/book/${trainer.id}`}
                    className="bg-[var(--th-accent)] hover:brightness-110 text-white font-semibold rounded-full px-6 py-3 text-[15px] transition-all shadow-sm"
                  >
                    Ingyenes konzultáció
                  </a>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT — sticky booking card, aligned with top of hero */}
          <aside className="hidden md:block">
            <div className="sticky top-20">
              <BookingCard
                trainerId={trainer.id}
                hourlyRate={trainer.hourly_rate}
                trainerName={trainer.full_name ?? ""}
                nearestSlots={nearestSlots}
                phone={trainer.phone ?? null}
              />
            </div>
          </aside>
        </div>
      </div>

      <MobileBar trainerId={trainer.id} hourlyRate={trainer.hourly_rate} />
    </div>
  );
}
