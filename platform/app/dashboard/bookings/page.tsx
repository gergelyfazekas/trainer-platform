import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { hu } from "@/messages/hu";

const STATUS_LABELS: Record<string, string> = {
  pending: "Függőben",
  confirmed: "Visszaigazolva",
  cancelled: "Lemondva",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-[var(--th-muted)] text-[var(--th-fg-muted)]",
};

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("trainer_id", user!.id)
    .order("appointment_at", { ascending: true });

  async function updateStatus(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const status = formData.get("status") as "pending" | "confirmed" | "cancelled";
    const supabase = await createClient();
    await supabase.from("bookings").update({ status }).eq("id", id);
    revalidatePath("/dashboard/bookings");
  }

  const fmt = (ts: string) =>
    new Intl.DateTimeFormat("hu-HU", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Europe/Budapest",
    }).format(new Date(ts));

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-[var(--th-fg)]">{hu.dashboard.bookings}</h1>

      {!bookings?.length ? (
        <p className="text-[var(--th-fg-muted)]">{hu.dashboard.noBookings}</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white border border-[var(--th-border)] rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-[var(--th-fg)]">{b.visitor_name}</p>
                  <p className="text-sm text-[var(--th-fg-muted)]">{b.visitor_email}{b.visitor_phone ? ` · ${b.visitor_phone}` : ""}</p>
                  <p className="text-sm text-[var(--th-fg)] mt-1">{fmt(b.appointment_at)} · {b.duration_min} perc</p>
                  {b.notes && <p className="text-sm text-[var(--th-fg-muted)] mt-1 italic">"{b.notes}"</p>}
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${STATUS_COLORS[b.status] ?? "bg-[var(--th-muted)] text-[var(--th-fg)]"}`}>
                  {STATUS_LABELS[b.status] ?? b.status}
                </span>
              </div>

              {b.status === "pending" && (
                <div className="flex gap-2 pt-1">
                  <form action={updateStatus}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="status" value="confirmed" />
                    <button className="text-sm bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors">
                      Visszaigazolás
                    </button>
                  </form>
                  <form action={updateStatus}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="status" value="cancelled" />
                    <button className="text-sm bg-red-50 hover:bg-red-100 text-red-700 font-medium px-3 py-1.5 rounded-lg transition-colors">
                      Lemondás
                    </button>
                  </form>
                </div>
              )}

              {b.status === "confirmed" && (
                <form action={updateStatus}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="status" value="cancelled" />
                  <button className="text-sm text-red-600 hover:underline">
                    Lemondás
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
