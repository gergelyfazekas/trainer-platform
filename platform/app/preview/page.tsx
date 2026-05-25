import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TrainerCard } from "@/components/trainer-card";
import { SearchBar } from "@/components/search-bar";
import { Navbar } from "@/components/navbar";
import { hu } from "@/messages/hu";

export const metadata: Metadata = {
  title: "Előnézet – foglalj edzőt",
  robots: { index: false, follow: false },
};

export default async function PreviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: trainer } = await supabase
    .from("profiles")
    .select(
      "id, full_name, city, county, specialties, hourly_rate, profile_photo, is_featured, languages, certificate_status"
    )
    .eq("id", user.id)
    .single();

  const [{ data: profileCityRows }, { data: gymCityRows }] = await Promise.all([
    supabase.from("profiles").select("city").eq("is_active", true).not("city", "is", null),
    supabase.from("trainer_gym_locations").select("city").not("city", "is", null),
  ]);
  const trainerCities = [
    ...new Set(
      [
        ...(profileCityRows ?? []).map((r) => r.city as string),
        ...(gymCityRows ?? []).map((r) => r.city as string),
      ].filter(Boolean)
    ),
  ].sort();

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      {/* Preview banner */}
      <div className="bg-[var(--th-accent)] text-white text-center py-2.5 px-4 text-[13px] font-medium">
        Előnézet — így fog kinézni a profilod az élő oldalon.{" "}
        <Link href="/dashboard/profile" className="underline underline-offset-2 hover:opacity-80 transition-opacity">
          Profil szerkesztése
        </Link>
      </div>

      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative bg-[#FAF8F3] overflow-hidden pt-8 md:pt-12 pb-10 md:pb-14 px-4 text-center">
          <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse,rgba(234,162,88,0.22),transparent_65%)] blur-3xl" aria-hidden="true" />
          <div className="absolute top-[40px] right-[-100px] w-[500px] h-[400px] bg-[radial-gradient(ellipse,rgba(239,118,80,0.10),transparent_65%)] blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-white" aria-hidden="true" />

          <div className="relative z-10 max-w-[860px] mx-auto">
            <div className="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full border border-[#D4A574]/30 bg-[#FEF3E2]/60 text-[#A0693A] text-[13px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D05A2E]" />
              Magyarország személyi edző platformja
            </div>
            <h1 className="text-[42px] md:text-[58px] font-bold text-[var(--th-fg)] leading-[1.04] tracking-[-0.02em] mb-3">
              {hu.hero.title}
            </h1>
            <p className="text-[var(--th-fg-muted)] text-base md:text-lg leading-relaxed max-w-[520px] mx-auto mb-6">
              {hu.hero.subtitle}
            </p>
            <div className="flex justify-center">
              <SearchBar trainerCities={trainerCities} />
            </div>
            <div className="mt-5 flex items-center justify-center gap-5 text-[var(--th-fg-muted)] text-[13px]">
              <span>✓ Ingyenes böngészés</span>
              <span className="w-px h-3 bg-[var(--th-border)]" aria-hidden="true" />
              <span>✓ Azonnali foglalás</span>
              <span className="w-px h-3 bg-[var(--th-border)]" aria-hidden="true" />
              <span>✓ Ellenőrzött edzők</span>
            </div>
          </div>
        </section>

        {trainer ? (
          <div className="bg-white">
            <section className="max-w-[1280px] mx-auto px-6 pt-3 pb-14">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--th-accent)] mb-1">
                {trainer.is_featured ? "Ajánlott" : "Edzők"}
              </p>
              <div className="flex items-end justify-between mb-4">
                <h2 className="text-[22px] font-bold text-[var(--th-fg)]">
                  {trainer.is_featured ? "Kiemelt edzők" : "Legújabb edzők"}
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                <TrainerCard {...trainer} />
              </div>
            </section>
          </div>
        ) : (
          <div className="text-center py-24 bg-white">
            <p className="text-[var(--th-fg-muted)] text-base mb-4">
              A profilod még nincs kitöltve — töltsd ki az adataidat, hogy megjelenj az oldalon.
            </p>
            <Link
              href="/dashboard/profile"
              className="inline-block bg-[var(--th-accent)] hover:brightness-95 text-[var(--th-accent-fg)] font-semibold rounded-full px-6 py-3 text-[15px] transition-all shadow-sm"
            >
              Profil kitöltése
            </Link>
          </div>
        )}

        {/* Trainer CTA */}
        <section className="bg-[var(--th-fg)] text-white py-20 px-6 mt-8">
          <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--th-accent)] opacity-80">
                Edzőknek
              </p>
              <h2 className="text-[36px] font-bold leading-[1.1]">
                Hirdesd magad Magyarország
                <br />
                legjobb edzői között
              </h2>
              <ul className="space-y-2 text-[var(--th-muted)] text-[15px]">
                <li>✓ Saját profiloldal fotókkal és szakágakkal</li>
                <li>✓ Közvetlen foglalás és üzenetküldés</li>
                <li>✓ Kiemelés a keresési találatokban</li>
              </ul>
              <Link
                href="/auth/register"
                className="inline-block bg-[var(--th-accent)] hover:brightness-95 text-[var(--th-accent-fg)] font-semibold rounded-full px-6 py-3 text-[15px] transition-all shadow-sm mt-2"
              >
                Regisztrálj edzőként
              </Link>
            </div>
            <div className="flex-1 max-w-[420px] bg-white/10 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-md bg-white/20" />
                <div className="h-3 bg-white/30 rounded w-24" />
              </div>
              <div className="h-2.5 bg-white/20 rounded w-full" />
              <div className="h-2.5 bg-white/15 rounded w-4/5" />
              <div className="h-2.5 bg-white/15 rounded w-3/5" />
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-12 bg-white/10 rounded-xl" />
                ))}
              </div>
              <div className="mt-3 h-2 bg-white/10 rounded w-full" />
              <div className="h-2 bg-white/10 rounded w-2/3" />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[var(--th-bg)] border-t border-[var(--th-border)] py-12 px-6">
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-[14px]">
          <div>
            <div className="mb-3">
              <span className="text-[16px] font-medium text-[var(--th-fg)]">foglalj <span className="font-bold text-[var(--th-accent)]">edzőt</span></span>
            </div>
            <p className="text-[var(--th-fg-muted)] text-[13px] leading-relaxed">
              Magyarország személyi edző platformja.
            </p>
          </div>
          <div>
            <div className="font-semibold text-[var(--th-fg)] mb-3">Platform</div>
            <ul className="space-y-2 text-[var(--th-fg-muted)]">
              <li>
                <Link href="/auth/register" className="hover:text-[var(--th-fg)] transition-colors">
                  Regisztráció
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-[var(--th-fg)] mb-3">Edzőknek</div>
            <ul className="space-y-2 text-[var(--th-fg-muted)]">
              <li>
                <Link href="/dashboard" className="hover:text-[var(--th-fg)] transition-colors">
                  Irányítópult
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-[var(--th-fg)] mb-3">Cég</div>
            <ul className="space-y-2 text-[var(--th-fg-muted)]">
              <li>
                <a href="mailto:info@foglaljedzot.hu" className="hover:text-[var(--th-fg)] transition-colors">
                  Kapcsolat
                </a>
              </li>
              <li>
                <Link href="/aszf" className="hover:text-[var(--th-fg)] transition-colors">
                  ÁSZF
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto mt-10 pt-6 border-t border-[var(--th-border)] text-[12px] text-[var(--th-fg-muted)]">
          © {new Date().getFullYear()} foglalj edzőt. Minden jog fenntartva.
        </div>
      </footer>
    </div>
  );
}
