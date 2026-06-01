import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://foglaljedzot.hu";
  const supabase = await createClient();
  const { data: trainers } = await supabase
    .from("profiles")
    .select("id, updated_at")
    .eq("is_active", true);

  const trainerUrls: MetadataRoute.Sitemap = (trainers ?? []).map((t) => ({
    url: `${baseUrl}/trainers/${t.id}`,
    lastModified: new Date(t.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/trainers`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/aszf`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    ...trainerUrls,
  ];
}
