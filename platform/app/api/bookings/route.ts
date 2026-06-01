import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { checkRateLimit } from "@/lib/rate-limit";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip, 5)) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const body = await request.json();
  const { trainer_id, visitor_name, visitor_email, visitor_phone, appointment_at, duration_min, notes } = body;

  if (!trainer_id || !visitor_name || !visitor_email || !appointment_at) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Use service client for all DB operations in this public endpoint —
  // the route itself is the security boundary (validation + conflict check above)
  const serviceClient = createServiceClient();

  // Re-check slot availability (race condition guard)
  const apptStart = new Date(appointment_at);
  const apptEnd = new Date(apptStart.getTime() + (duration_min ?? 60) * 60000);

  const { data: conflicts } = await serviceClient
    .from("bookings")
    .select("id")
    .eq("trainer_id", trainer_id)
    .neq("status", "cancelled")
    .gte("appointment_at", apptStart.toISOString())
    .lt("appointment_at", apptEnd.toISOString());

  if (conflicts && conflicts.length > 0) {
    return NextResponse.json({ error: "slot_taken" }, { status: 409 });
  }

  const { data: booking, error } = await serviceClient
    .from("bookings")
    .insert({
      trainer_id,
      visitor_name,
      visitor_email,
      visitor_phone,
      appointment_at,
      duration_min: duration_min ?? 60,
      notes,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("booking insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch trainer email for notification
  const { data: trainerProfile } = await serviceClient
    .from("profiles")
    .select("full_name")
    .eq("id", trainer_id)
    .single();

  const { data: trainerAuth } = await serviceClient.auth.admin.getUserById(trainer_id);

  const formattedDate = new Intl.DateTimeFormat("hu-HU", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Budapest",
  }).format(new Date(appointment_at));

  try {
    if (trainerAuth?.user?.email) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: trainerAuth.user.email,
        subject: `Új foglalás: ${escapeHtml(visitor_name)}`,
        html: `<p>Új foglalási kérés érkezett.</p>
          <p><strong>Vendég:</strong> ${escapeHtml(visitor_name)} (${escapeHtml(visitor_email)})</p>
          <p><strong>Időpont:</strong> ${formattedDate}</p>
          ${notes ? `<p><strong>Megjegyzés:</strong> ${escapeHtml(notes)}</p>` : ""}
          <p>Jelentkezz be az irányítópulton a visszaigazoláshoz.</p>`,
      });
    }
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: visitor_email,
      subject: "Foglalás visszaigazolása",
      html: `<p>Kedves ${escapeHtml(visitor_name)}!</p>
        <p>Foglalásod megérkezett ${escapeHtml(trainerProfile?.full_name ?? "az edzőhöz")}.</p>
        <p><strong>Időpont:</strong> ${formattedDate}</p>
        <p>Hamarosan visszaigazolást kapsz az edzőtől.</p>`,
    });
  } catch {
    // Email delivery is best-effort; booking is already saved
  }

  return NextResponse.json({ booking });
}
