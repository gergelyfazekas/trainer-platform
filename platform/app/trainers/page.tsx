import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TrainerCard } from "@/components/trainer-card";
import { SearchBar } from "@/components/search-bar";
import { FilterSidebar } from "@/components/filter-sidebar";
import { ViewToggle } from "@/components/view-toggle";
import { TrainerMapWrapper } from "@/components/trainer-map-wrapper";
import { MobileFilterToggle } from "@/components/mobile-filter-toggle";
import { Navbar } from "@/components/navbar";
import { hu } from "@/messages/hu";

export const metadata: Metadata = {
  title: "Edzők böngészése – foglalj edzőt",
  description:
    "Böngéssz Magyarország legjobb személyi edzői között. Szűrj helyszín, szakterület, ár és elérhetőség szerint.",
  openGraph: {
    title: "Edzők böngészése – foglalj edzőt",
    description:
      "Böngéssz Magyarország legjobb személyi edzői között. Szűrj helyszín, szakterület, ár és elérhetőség szerint.",
  },
};

const VALID_AVAIL_TIMES = new Set(["morning", "daytime", "evening"]);
const VALID_AVAIL_DAYS = new Set(["weekdays", "weekends"]);

interface Props {
  searchParams: Promise<{ q?: string; county?: string; city?: string; minRate?: string; maxRate?: string; view?: string; gyms?: string; langs?: string; availDays?: string; availTimes?: string }>;
}

export default async function TrainersPage({ searchParams }: Props) {
  const { q, county, city, minRate, maxRate, view, gyms, langs, availDays, availTimes } = await searchParams;
  const selectedGyms = gyms ? gyms.split(",").filter(Boolean) : [];
  const selectedLanguages = langs ? langs.split(",").filter(Boolean) : [];
  const selectedAvailDays = availDays ? availDays.split(",").filter((d) => VALID_AVAIL_DAYS.has(d)) : [];
  const selectedAvailTimes = availTimes ? availTimes.split(",").filter((t) => VALID_AVAIL_TIMES.has(t)) : [];
  // Strip characters that could inject into raw PostgREST filter strings
  const sanitizedQ = q ? q.replace(/[(){}\[\]"'`,]/g, "").trim().slice(0, 100) : "";
  const isMapView = view === "map";
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("id, full_name, city, county, specialties, hourly_rate, profile_photo, is_featured, latitude, longitude, languages, certificate_status")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (county) query = query.eq("county", county);
  if (city) query = query.ilike("city", `%${city}%`);
  if (minRate) query = query.gte("hourly_rate", Number(minRate));
  if (maxRate) query = query.lte("hourly_rate", Number(maxRate));

  if (selectedLanguages.length > 0) {
    query = query.overlaps("languages", selectedLanguages);
  }

  if (selectedAvailDays.length > 0) {
    const times = selectedAvailTimes.length > 0 ? selectedAvailTimes : ["morning", "daytime", "evening"];
    const hasWeekdays = selectedAvailDays.includes("weekdays");
    const hasWeekends = selectedAvailDays.includes("weekends");
    const tf = `{${times.join(",")}}`;
    if (hasWeekdays && hasWeekends) {
      query = query.or(`avail_weekdays.ov.${tf},avail_weekends.ov.${tf}`);
    } else if (hasWeekdays) {
      query = query.overlaps("avail_weekdays", times);
    } else if (hasWeekends) {
      query = query.overlaps("avail_weekends", times);
    }
  } else if (selectedAvailTimes.length > 0) {
    const tf = `{${selectedAvailTimes.join(",")}}`;
    query = query.or(`avail_weekdays.ov.${tf},avail_weekends.ov.${tf}`);
  }

  if (selectedGyms.length > 0) {
    const { data: gymRows } = await supabase
      .from("trainer_gym_locations")
      .select("trainer_id")
      .in("name", selectedGyms);
    const trainerIds = [...new Set(gymRows?.map((r) => r.trainer_id) ?? [])];
    query = trainerIds.length > 0
      ? query.in("id", trainerIds)
      : query.in("id", ["00000000-0000-0000-0000-000000000000"]);
  }

  if (sanitizedQ) {
    query = query.or(
      `city.ilike.%${sanitizedQ}%,full_name.ilike.%${sanitizedQ}%,specialties.cs.{${sanitizedQ}}`
    );
  }

  const { data: trainers } = await query.limit(50);

  // Distinct gym names that have at least one trainer
  const { data: gymRows } = await supabase
    .from("trainer_gym_locations")
    .select("name")
    .order("name");
  const gymOptions = [...new Set(gymRows?.map((r) => r.name).filter(Boolean) ?? [])] as string[];

  // Distinct languages spoken by at least one active trainer
  const { data: langRows } = await supabase
    .from("profiles")
    .select("languages")
    .eq("is_active", true)
    .not("languages", "is", null);
  const languageOptions = [...new Set(langRows?.flatMap((r) => r.languages ?? []).filter(Boolean) ?? [])].sort() as string[];

  const { data: allGymCityRows } = await supabase
    .from("trainer_gym_locations").select("city").not("city", "is", null);
  const trainerCities = [
    ...new Set([
      ...(trainers ?? []).map((t) => t.city).filter(Boolean) as string[],
      ...(allGymCityRows ?? []).map((r) => r.city as string).filter(Boolean),
    ]),
  ].sort();

  // For trainers without exact coordinates, fetch their first gym location to enable full-address geocoding
  let geocodeAddresses: Record<string, string> = {};
  if (trainers) {
    const needsGeocode = trainers.filter((t) => t.latitude == null).map((t) => t.id);
    if (needsGeocode.length > 0) {
      const { data: gymRows } = await supabase
        .from("trainer_gym_locations")
        .select("trainer_id, street_address, postal_code, city")
        .in("trainer_id", needsGeocode);

      if (gymRows) {
        for (const row of gymRows) {
          if (geocodeAddresses[row.trainer_id]) continue; // keep first gym only
          const parts = [row.street_address, [row.postal_code, row.city].filter(Boolean).join(" ")].filter(Boolean);
          if (parts.length > 0) geocodeAddresses[row.trainer_id] = parts.join(", ");
        }
      }
    }
  }

  const trainersWithAddress = (trainers ?? []).map((t) => ({
    ...t,
    geocodeAddress: geocodeAddresses[t.id] ?? null,
  }));

  return (
    <div className="min-h-screen bg-[var(--th-bg)]">
      <Navbar activeHref="/trainers" />

      <main className="max-w-[1280px] mx-auto px-6 py-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-[var(--th-fg)]">{hu.nav.trainers}</h1>
          <SearchBar initialCity={city} initialMinRate={minRate} initialMaxRate={maxRate} trainerCities={trainerCities} />
        </div>

        <ViewToggle currentView={isMapView ? "map" : "list"} />

        <div className="flex flex-col md:flex-row gap-6 items-start">
          <MobileFilterToggle>
            <FilterSidebar
              initialCity={city}
              initialMinRate={minRate}
              initialMaxRate={maxRate}
              initialGyms={selectedGyms}
              gymOptions={gymOptions}
              initialLanguages={selectedLanguages}
              languageOptions={languageOptions}
              initialAvailDays={selectedAvailDays}
              initialAvailTimes={selectedAvailTimes}
            />
          </MobileFilterToggle>

          <div className="flex-1 min-w-0">
            {isMapView ? (
              <TrainerMapWrapper trainers={trainersWithAddress} />
            ) : (
              <>
                {trainers && trainers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trainers.map((t) => <TrainerCard key={t.id} {...t} languages={t.languages} />)}
                  </div>
                ) : (
                  <p className="text-[var(--th-fg-muted)] text-center py-16">{hu.search.noResults}</p>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
