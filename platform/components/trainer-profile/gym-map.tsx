"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
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

interface GymLocation {
  name: string;
  city: string | null;
  postal_code: string | null;
  street_address: string | null;
}

interface PlacedGym extends GymLocation {
  lat: number;
  lng: number;
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

function FitBounds({ placed }: { placed: PlacedGym[] }) {
  const map = useMap();
  useEffect(() => {
    if (placed.length === 0) return;
    if (placed.length === 1) {
      map.setView([placed[0].lat, placed[0].lng], 14);
    } else {
      const bounds = L.latLngBounds(placed.map((g) => [g.lat, g.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [placed]);
  return null;
}

export function GymMap({ locations }: { locations: GymLocation[] }) {
  const [placed, setPlaced] = useState<PlacedGym[]>([]);

  useEffect(() => {
    if (locations.length === 0) return;
    async function run() {
      const results: PlacedGym[] = [];
      for (const loc of locations) {
        const addressParts = [loc.street_address, loc.postal_code, loc.city].filter(Boolean);
        const query = addressParts.length > 0 ? addressParts.join(", ") : loc.name;
        const coords = await geocode(query);
        if (coords) {
          results.push({ ...loc, lat: coords[0], lng: coords[1] });
          setPlaced((prev) => [...prev, { ...loc, lat: coords[0], lng: coords[1] }]);
        }
        // Nominatim rate limit: 1 req/s
        await new Promise((r) => setTimeout(r, 1100));
      }
    }
    run();
  }, []);

  return (
    <MapContainer
      center={BUDAPEST_CENTER}
      zoom={11}
      style={{ width: "100%", height: "100%" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds placed={placed} />
      {placed.map((g, i) => {
        const address = [g.postal_code, g.city, g.street_address].filter(Boolean).join(" ");
        return (
          <Marker key={i} position={[g.lat, g.lng]} icon={pinIcon}>
            <Popup>
              <div className="text-sm space-y-0.5 min-w-[140px]">
                <p className="font-semibold">{g.name}</p>
                {address && <p className="text-gray-500 text-xs">{address}</p>}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
