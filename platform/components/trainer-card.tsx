import Image from "next/image";
import Link from "next/link";
import { hu } from "@/messages/hu";

const LANGUAGE_FLAGS: Record<string, string> = {
  Magyar: "🇭🇺",
  Angol: "🇬🇧",
  Német: "🇩🇪",
  Francia: "🇫🇷",
  Spanyol: "🇪🇸",
  Olasz: "🇮🇹",
  Orosz: "🇷🇺",
  Portugál: "🇵🇹",
  Román: "🇷🇴",
  Szerb: "🇷🇸",
  Horvát: "🇭🇷",
  Szlovák: "🇸🇰",
  Ukrán: "🇺🇦",
  Kínai: "🇨🇳",
  Japán: "🇯🇵",
  Arab: "🇸🇦",
};

interface TrainerCardProps {
  id: string;
  full_name: string | null;
  city: string | null;
  county: string | null;
  specialties: string[] | null;
  hourly_rate: number | null;
  profile_photo: string | null;
  is_featured: boolean;
  languages?: string[] | null;
  certificate_status?: string | null;
  compact?: boolean;
}

export function TrainerCard({
  id,
  full_name,
  city,
  county,
  specialties,
  hourly_rate,
  profile_photo,
  is_featured,
  languages,
  certificate_status,
  compact = false,
}: TrainerCardProps) {
  const isVerified = certificate_status === "approved";
  const location = [city, county].filter(Boolean).join(", ");
  const displayRate = hourly_rate
    ? new Intl.NumberFormat("hu-HU", { style: "currency", currency: "HUF", maximumFractionDigits: 0 }).format(hourly_rate)
    : null;
  const flags = (languages ?? []).map((l) => LANGUAGE_FLAGS[l]).filter(Boolean).slice(0, 5);

  if (compact) {
    return (
      <Link href={`/trainers/${id}`} className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--th-muted)] transition-colors">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[var(--th-muted)] shrink-0">
          {profile_photo ? (
            <Image src={profile_photo} alt={full_name ?? ""} fill className="object-cover" sizes="48px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-[var(--th-border)]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-[14px] text-[var(--th-fg)] truncate">{full_name ?? "—"}</p>
            {is_featured && <span className="text-[10px] font-semibold text-[var(--th-accent)] shrink-0">{hu.trainerCard.featured}</span>}
            {isVerified && (
              <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 shrink-0 text-emerald-500" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          {location && <p className="text-[12px] text-[var(--th-fg-muted)] truncate">{location}</p>}
          {displayRate && <p className="text-[12px] text-[var(--th-fg-muted)]">{displayRate} {hu.trainerCard.hourlyRate}</p>}
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/trainers/${id}`} className="group block">
      {/* Photo */}
      <div className="relative rounded-2xl overflow-hidden bg-[var(--th-muted)] aspect-[4/4.5]">
        {profile_photo ? (
          <Image
            src={profile_photo}
            alt={full_name ?? ""}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-[var(--th-border)]" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        )}

        {is_featured && (
          <span className="absolute top-3 left-3 bg-white text-[var(--th-fg)] text-[12px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
            {hu.trainerCard.featured}
          </span>
        )}
        {isVerified && (
          <span className="absolute top-3 right-3 bg-white text-emerald-700 text-[11px] font-semibold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
            <svg viewBox="0 0 20 20" className="w-3 h-3 shrink-0" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            Ellenőrzött
          </span>
        )}

        {flags.length > 0 && (
          <div className="absolute bottom-2.5 left-2.5 flex gap-1">
            {flags.map((flag, i) => (
              <span
                key={i}
                className="text-[18px] leading-none drop-shadow-sm"
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }}
              >
                {flag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="pt-3 space-y-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold text-[15px] text-[var(--th-fg)] truncate">{full_name ?? "—"}</div>
          {displayRate && (
            <div className="text-[14px] shrink-0">
              <span className="font-semibold text-[var(--th-fg)]">{displayRate}</span>
              <span className="text-[var(--th-fg-muted)]"> {hu.trainerCard.hourlyRate}</span>
            </div>
          )}
        </div>
        {location && (
          <div className="text-[14px] text-[var(--th-fg-muted)] truncate">{location}</div>
        )}
        {specialties && specialties.length > 0 && (
          <div className="text-[14px] text-[var(--th-fg-muted)] truncate">
            {specialties.slice(0, 2).join(" · ")}
          </div>
        )}
      </div>
    </Link>
  );
}
