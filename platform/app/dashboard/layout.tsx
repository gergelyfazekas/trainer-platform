import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/app/dashboard/_components/dashboard-shell";
import { hu } from "@/messages/hu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const navItems = [
    { href: "/dashboard", label: hu.dashboard.overview },
    { href: "/dashboard/profile", label: hu.dashboard.profile },
    { href: "/dashboard/availability", label: hu.dashboard.availability },
    { href: "/dashboard/packages", label: hu.dashboard.packages },
    { href: "/dashboard/bookings", label: hu.dashboard.bookings },
    { href: "/dashboard/messages", label: hu.dashboard.messages },
    { href: "/dashboard/billing", label: hu.dashboard.billing },
    { href: "/preview", label: hu.dashboard.preview },
  ];

  return <DashboardShell navItems={navItems}>{children}</DashboardShell>;
}
