"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

const pinIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});


interface Trainer {
  id: string;
  full_name: string | null;
  city: string | null;
  hourly_rate: number | null;
  profile_photo: string | null;
  latitude: number | null;
  longitude: number | null;
  geocodeAddress: string | null;
}

interface PlacedTrainer extends Trainer {
  lat: number;
  lng: number;
  approximate: boolean;
}

const BUDAPEST_CENTER: [number, number] = [47.497913, 19.040236];

async function geocode(address: string): Promise<[number, number] | null> {
  try {
    const q = address.includes("Hungary") ? address : `${address}, Hungary`;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
      { headers: { "Accept-Language": "hu", "User-Agent": "foglaljedzot/1.0" } }
    );
    const data = await res.json();
    if (data[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {}
  return null;
}

export function TrainerMap({ trainers }: { trainers: Trainer[] }) {
  const exact = trainers.filter((t) => t.latitude != null && t.longitude != null);
  const needsGeocode = trainers.filter((t) => t.latitude == null && (t.geocodeAddress || t.city));

  const [geocoded, setGeocoded] = useState<PlacedTrainer[]>([]);

  useEffect(() => {
    if (needsGeocode.length === 0) return;

    // Deduplicate query strings to minimise requests
    const cache = new Map<string, [number, number]>();

    async function run() {
      const results: PlacedTrainer[] = [];
      for (const t of needsGeocode) {
        const query = t.geocodeAddress ?? t.city!;
        let coords = cache.get(query);
        if (!coords) {
          const fetched = await geocode(query);
          if (!fetched) continue;
          cache.set(query, fetched);
          coords = fetched;
          // Respect Nominatim rate limit: 1 req/s
          await new Promise((r) => setTimeout(r, 1100));
        }
        results.push({ ...t, lat: coords[0], lng: coords[1], approximate: true });
      }
      setGeocoded(results);
    }

    run();
  }, []);

  const exactPlaced: PlacedTrainer[] = exact.map((t) => ({
    ...t,
    lat: t.latitude!,
    lng: t.longitude!,
    approximate: false,
  }));

  const allPlaced = [...exactPlaced, ...geocoded];

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-gray-200" style={{ height: "calc(100vh - 220px)", minHeight: 400 }}>
      <MapContainer
        center={BUDAPEST_CENTER}
        zoom={11}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {allPlaced.map((t) => (
          <Marker
            key={t.id}
            position={[t.lat, t.lng]}
            icon={pinIcon}
          >
            <Popup>
              <div className="text-sm space-y-1 min-w-[140px]">
                {t.profile_photo && (
                  <img src={t.profile_photo} alt="" className="w-full h-20 object-cover rounded mb-2" />
                )}
                <p className="font-semibold">{t.full_name ?? "—"}</p>
                {t.city && <p className="text-gray-500">{t.city}</p>}
                {t.hourly_rate && <p className="text-gray-500">{t.hourly_rate.toLocaleString("hu-HU")} Ft/óra</p>}
                <Link href={`/trainers/${t.id}`} className="block mt-2 text-blue-600 hover:underline text-xs">
                  Profil megtekintése →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {allPlaced.length === 0 && needsGeocode.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-[1000]">
          <p className="text-gray-500 text-sm">Nincs edző megadott helyszínnel.</p>
        </div>
      )}
    </div>
  );
}
