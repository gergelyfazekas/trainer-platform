import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const body = await request.json();
  const { trainer_id, sender_name, sender_email, message_body, honeypot } = body;

  // Honeypot spam check
  if (honeypot) {
    return NextResponse.json({ ok: true });
  }

  if (!trainer_id || !sender_name || !sender_email || !message_body) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = await createClient();

  const { error } = await supabase.from("messages").insert({
    trainer_id,
    sender_name,
    sender_email,
    body: message_body,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const serviceClient = createServiceClient();
  const { data: trainerAuth } = await serviceClient.auth.admin.getUserById(trainer_id);

  try {
    if (trainerAuth?.user?.email) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: trainerAuth.user.email,
        replyTo: sender_email,
        subject: `Új üzenet: ${sender_name}`,
        html: `<p><strong>${sender_name}</strong> (${sender_email}) üzenetet küldött:</p>
          <blockquote>${message_body}</blockquote>
          <p>Válaszolhatsz közvetlenül erre az e-mailre.</p>`,
      });
    }
  } catch {
    // Email delivery is best-effort; message is already saved
  }

  return NextResponse.json({ ok: true });
}
