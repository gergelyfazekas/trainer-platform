import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { hu } from "@/messages/hu";

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("trainer_id", user!.id)
    .order("created_at", { ascending: false });

  async function markRead(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const supabase = await createClient();
    await supabase.from("messages").update({ is_read: true }).eq("id", id);
    revalidatePath("/dashboard/messages");
  }

  const fmt = (ts: string) =>
    new Intl.DateTimeFormat("hu-HU", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Europe/Budapest",
    }).format(new Date(ts));

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-[var(--th-fg)]">{hu.dashboard.messages}</h1>

      {!messages?.length ? (
        <p className="text-[var(--th-fg-muted)]">{hu.dashboard.noMessages}</p>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`bg-white border rounded-xl p-4 space-y-2 ${
                m.is_read ? "border-[var(--th-border)]" : "border-[var(--th-accent)] ring-1 ring-[var(--th-accent)]/20"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-[var(--th-fg)]">{m.sender_name}</p>
                  <a
                    href={`mailto:${m.sender_email}`}
                    className="text-sm text-[var(--th-accent)] hover:underline"
                  >
                    {m.sender_email}
                  </a>
                  <p className="text-xs text-[var(--th-fg-muted)] mt-0.5">{fmt(m.created_at)}</p>
                </div>
                {!m.is_read && (
                  <span className="text-xs font-semibold bg-[var(--th-accent)] text-[var(--th-accent-fg)] px-2 py-0.5 rounded-full shrink-0">
                    Új
                  </span>
                )}
              </div>

              <p className="text-[var(--th-fg)] text-sm whitespace-pre-line">{m.body}</p>

              <div className="flex items-center gap-3 pt-1">
                <a
                  href={`mailto:${m.sender_email}`}
                  className="text-sm text-[var(--th-accent)] hover:underline font-medium"
                >
                  Válasz e-mailben →
                </a>
                {!m.is_read && (
                  <form action={markRead}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="text-sm text-[var(--th-fg-muted)] hover:text-[var(--th-fg)]">
                      Olvasottnak jelöl
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
