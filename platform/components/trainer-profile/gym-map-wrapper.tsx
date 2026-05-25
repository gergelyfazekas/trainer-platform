"use client";

import dynamic from "next/dynamic";

interface GymLocation {
  name: string;
  city: string | null;
  postal_code: string | null;
  street_address: string | null;
}

const GymMap = dynamic(
  () => import("@/components/trainer-profile/gym-map").then((m) => m.GymMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[280px] bg-[var(--th-muted)] rounded-2xl animate-pulse" />
    ),
  }
);

export function GymMapWrapper({ locations }: { locations: GymLocation[] }) {
  return <GymMap locations={locations} />;
}
