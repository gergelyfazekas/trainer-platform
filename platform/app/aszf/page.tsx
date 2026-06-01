import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Általános Szerződési Feltételek – foglalj edzőt",
};

export default function AszfPage() {
  return (
    <div className="min-h-screen bg-[var(--th-bg)]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--th-fg-muted)] hover:text-[var(--th-fg)] transition-colors mb-8"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Vissza a főoldalra
        </Link>

        <h1 className="text-3xl font-bold text-[var(--th-fg)] mb-2">Általános Szerződési Feltételek</h1>
        <p className="text-sm text-[var(--th-fg-muted)] mb-10">Utolsó módosítás: 2026. május</p>

        <div className="space-y-10 text-[15px] text-[var(--th-fg)] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. A szolgáltatás leírása</h2>
            <p className="text-[var(--th-fg-muted)]">
              A <strong>foglalj edzőt</strong> platform (továbbiakban: Platform) egy online hirdetési felület,
              amely személyi edzőket (továbbiakban: Edző) és potenciális ügyfeleiket
              (továbbiakban: Látogató) kapcsolja össze Magyarországon. A Platform üzemeltetője a szolgáltatást
              magyarországi személyi edzők számára biztosítja havi előfizetés ellenében.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Az előfizetési feltételek</h2>
            <p className="text-[var(--th-fg-muted)]">
              Az Edzők két előfizetési csomag közül választhatnak: <strong>Basic</strong> és{" "}
              <strong>Kiemelt (Featured)</strong>. Az előfizetési díj havonta, előre fizetendő HUF-ban.
              A fizetés Stripe fizetési platformon keresztül történik. A számlán 27%-os ÁFA szerepel
              a hatályos magyar jogszabályoknak megfelelően.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Lemondás és visszatérítés</h2>
            <p className="text-[var(--th-fg-muted)]">
              Az előfizetés bármikor lemondható a Stripe ügyfélportálon keresztül. A lemondás az aktuális
              számlázási időszak végén lép életbe. Visszatérítés nem jár a már kifizetett időszakra.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. A látogatók jogai és kötelezettségei</h2>
            <p className="text-[var(--th-fg-muted)]">
              A Látogatók a Platform használatához nem szükséges regisztrálniuk. A foglalási és üzenetküldési
              funkciókat névvel, e-mail-címmel és telefonszámmal vehetik igénybe. A Látogatók valós adatokat
              kötelesek megadni, és a kommunikációt kizárólag az edzési célú időpontfoglalásra használhatják.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Adatkezelés</h2>
            <p className="text-[var(--th-fg-muted)]">
              A Platform az adatokat az Európai Unió általános adatvédelmi rendeletének (GDPR) megfelelően kezeli.
              Az Edzők adatai a profil nyilvánosan látható részei kivételével nem kerülnek harmadik félnek átadásra.
              A Látogatók által megadott adatok kizárólag a foglalás lebonyolítása céljából kerülnek tárolásra.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Felelősségkorlátozás</h2>
            <p className="text-[var(--th-fg-muted)]">
              A Platform nem vállal felelősséget az Edzők által nyújtott szolgáltatások minőségéért, az edzések
              során bekövetkező esetleges sérülésekért, illetve az Edző és a Látogató között létrejött megállapodásból
              eredő vitákért. A Platform kizárólag hirdetési felületként működik.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Kapcsolat</h2>
            <p className="text-[var(--th-fg-muted)]">
              Kérdésekkel és panaszokkal forduljon hozzánk:{" "}
              <a href="mailto:info@foglaljedzot.hu" className="text-[var(--th-accent)] hover:underline">
                info@foglaljedzot.hu
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
