import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingView } from "./booking-view";

interface Props {
  params: Promise<{ trainerId: string }>;
  searchParams: Promise<{ slot?: string }>;
}

export default async function BookPage({ params, searchParams }: Props) {
  const { trainerId } = await params;
  const { slot: preselectedSlot } = await searchParams;
  const supabase = await createClient();

  const { data: trainer } = await supabase
    .from("profiles")
    .select("id, full_name, hourly_rate")
    .eq("id", trainerId)
    .eq("is_active", true)
    .single();

  if (!trainer) notFound();

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("day_of_week, start_time, end_time")
    .eq("trainer_id", trainerId);

  const lookahead = new Date();
  lookahead.setDate(lookahead.getDate() + 28);

  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("appointment_at, duration_min")
    .eq("trainer_id", trainerId)
    .neq("status", "cancelled")
    .gte("appointment_at", new Date().toISOString())
    .lte("appointment_at", lookahead.toISOString());

  // Generate available 60-min slots for the next 28 days
  const available: string[] = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset < 28; dayOffset++) {
    const date = new Date(now);
    date.setDate(now.getDate() + dayOffset);
    const dow = date.getDay(); // 0=Sun

    const daySlots = (slots ?? []).filter((s) => s.day_of_week === dow);

    for (const slot of daySlots) {
      const [sh, sm] = slot.start_time.split(":").map(Number);
      const [eh, em] = slot.end_time.split(":").map(Number);
      let cursor = sh * 60 + sm;
      const end = eh * 60 + em;

      while (cursor + 60 <= end) {
        const slotStart = new Date(date);
        slotStart.setHours(Math.floor(cursor / 60), cursor % 60, 0, 0);

        // Skip past slots
        if (slotStart <= now) { cursor += 60; continue; }

        // Check for conflicts with existing bookings
        const conflicted = (existingBookings ?? []).some((b) => {
          const bStart = new Date(b.appointment_at).getTime();
          const bEnd = bStart + (b.duration_min ?? 60) * 60000;
          const sStart = slotStart.getTime();
          const sEnd = sStart + 60 * 60000;
          return sStart < bEnd && sEnd > bStart;
        });

        if (!conflicted) available.push(slotStart.toISOString());
        cursor += 60;
      }
    }
  }

  return (
    <BookingView
      trainer={trainer}
      availableSlots={available}
      preselectedSlot={preselectedSlot ?? null}
    />
  );
}
