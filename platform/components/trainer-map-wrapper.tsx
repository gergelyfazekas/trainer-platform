"use client";

import dynamic from "next/dynamic";

const TrainerMap = dynamic(
  () => import("@/components/trainer-map").then((m) => m.TrainerMap),
  { ssr: false, loading: () => <div className="w-full h-96 bg-gray-100 rounded-xl animate-pulse" /> }
);

export interface TrainerForMap {
  id: string;
  full_name: string | null;
  city: string | null;
  hourly_rate: number | null;
  profile_photo: string | null;
  latitude: number | null;
  longitude: number | null;
  geocodeAddress: string | null;
}

export function TrainerMapWrapper({ trainers }: { trainers: TrainerForMap[] }) {
  return <TrainerMap trainers={trainers} />;
}
