import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { certificate_url } = await request.json();
  if (!certificate_url) {
    return NextResponse.json({ error: "Missing certificate_url" }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  const { error: dbError } = await serviceClient
    .from("profiles")
    .update({ certificate_url, certificate_status: "pending" })
    .eq("id", user.id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  const { data: profile } = await serviceClient
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const trainerName = profile?.full_name ?? "Ismeretlen edző";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const token = process.env.ADMIN_SECRET ?? "";
  const base = `${siteUrl}/api/admin/certificate?profileId=${user.id}&token=${encodeURIComponent(token)}&action=`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: process.env.ADMIN_EMAIL!,
      subject: `Tanúsítvány ellenőrzésre vár: ${trainerName}`,
      html: `
        <div style="font-family:sans-serif;max-width:540px;margin:0 auto;color:#0F172A">
          <h2 style="margin-bottom:8px">Új edzői tanúsítvány</h2>
          <p><strong>${trainerName}</strong> feltöltötte az edzői tanúsítványát.</p>
          <p style="margin-bottom:20px">
            <a href="${certificate_url}" style="color:#D05A2E">Tanúsítvány megtekintése ↗</a>
          </p>
          <p>
            <a href="${base}approve"
               style="background:#16a34a;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;margin-right:10px;display:inline-block">
              ✓ Jóváhagyás
            </a>
            <a href="${base}reject"
               style="background:#dc2626;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">
              ✗ Elutasítás
            </a>
          </p>
        </div>
      `,
    });
  } catch {
    // Email is best-effort; DB update already succeeded
  }

  return NextResponse.json({ ok: true });
}
