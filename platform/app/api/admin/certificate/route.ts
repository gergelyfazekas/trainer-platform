import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profileId");
  const action = searchParams.get("action");
  const token = searchParams.get("token");

  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret || token !== adminSecret || !profileId) {
    return html("Hibás vagy hiányzó token.", 401);
  }
  if (action !== "approve" && action !== "reject") {
    return html("Érvénytelen művelet.", 400);
  }

  const newStatus = action === "approve" ? "approved" : "rejected";
  const serviceClient = createServiceClient();

  const { error } = await serviceClient
    .from("profiles")
    .update({ certificate_status: newStatus })
    .eq("id", profileId);

  if (error) return html(`Adatbázis hiba: ${error.message}`, 500);

  const actionLabel = action === "approve" ? "jóváhagyva ✓" : "elutasítva ✗";
  const color = action === "approve" ? "#16a34a" : "#dc2626";
  return html(
    `<h2 style="color:${color}">Tanúsítvány ${actionLabel}</h2>
     <p>A profil státusza frissítve: <strong>${newStatus}</strong>.</p>`,
    200
  );
}

function html(body: string, status: number) {
  return new Response(
    `<!doctype html><html><body style="font-family:sans-serif;padding:40px;max-width:480px">${body}</body></html>`,
    { status, headers: { "Content-Type": "text/html" } }
  );
}
