import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hu } from "@/messages/hu";
import { BrandLogo } from "@/components/brand-logo";

interface NavbarProps {
  activeHref?: string;
  variant?: "light" | "dark";
}

export async function Navbar({ activeHref, variant = "light" }: NavbarProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initial = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    const name = profile?.full_name ?? user.email ?? "";
    initial = name.charAt(0).toUpperCase();
  }

  const isDark = variant === "dark";

  const linkClass = (href: string) =>
    isDark
      ? `text-[14px] font-medium px-3 py-2 rounded-full transition-colors hover:bg-white/10 ${
          activeHref === href ? "text-white" : "text-white/65 hover:text-white"
        }`
      : `text-[14px] font-medium px-3 py-2 rounded-full transition-colors hover:bg-[var(--th-muted)] ${
          activeHref === href
            ? "text-[var(--th-accent)]"
            : "text-[var(--th-fg-muted)] hover:text-[var(--th-fg)]"
        }`;

  return (
    <header className={`sticky top-0 z-50 ${isDark ? "bg-[#1E293B] border-b border-white/8" : "bg-[var(--th-bg)] shadow-[0_1px_12px_rgba(0,0,0,0.07)]"}`}>
      <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/">
          <BrandLogo variant={isDark ? "dark" : "light"} />
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/trainers" className={linkClass("/trainers")}>
            {hu.nav.trainers}
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              className="ml-2 flex items-center gap-2.5 bg-[var(--th-accent)] hover:brightness-95 text-white text-[14px] font-semibold rounded-full pl-3 pr-4 py-2 transition-all shadow-sm"
            >
              <span className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-[12px] font-bold leading-none">
                {initial}
              </span>
              {hu.nav.profile}
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className={linkClass("/auth/login")}>
                {hu.nav.login}
              </Link>
              <Link
                href="/auth/register"
                className="ml-2 bg-[var(--th-accent)] hover:brightness-95 text-[var(--th-accent-fg)] text-[14px] font-semibold rounded-full px-5 py-2 transition-all shadow-sm"
              >
                {hu.hero.trainerCta}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
