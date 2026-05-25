"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { signOut } from "@/app/dashboard/_actions/sign-out";
import { hu } from "@/messages/hu";

interface NavItem {
  href: string;
  label: string;
}

interface DashboardShellProps {
  navItems: NavItem[];
  children: React.ReactNode;
}

export function DashboardShell({ navItems, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const Sidebar = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <>
      <div className="px-4 h-16 border-b border-[var(--th-border)] flex items-center shrink-0">
        <Link href="/" onClick={onLinkClick}><BrandLogo /></Link>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === item.href
                ? "bg-[var(--th-muted)] text-[var(--th-fg)] font-medium"
                : "text-[var(--th-fg-muted)] hover:bg-[var(--th-muted)] hover:text-[var(--th-fg)]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-[var(--th-border)] shrink-0">
        <form action={signOut}>
          <button
            type="submit"
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-[var(--th-fg-muted)] hover:bg-[var(--th-muted)] transition-colors"
          >
            {hu.nav.logout}
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--th-bg)] flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-white border-r border-[var(--th-border)] flex-col shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-[var(--th-border)] flex flex-col md:hidden">
            <Sidebar onLinkClick={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="flex md:hidden items-center justify-between px-4 h-14 border-b border-[var(--th-border)] bg-white shrink-0">
          <Link href="/"><BrandLogo size="sm" /></Link>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-[var(--th-fg-muted)] hover:bg-[var(--th-muted)] transition-colors"
            aria-label="Menü megnyitása"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect y="3" width="20" height="2" rx="1" />
              <rect y="9" width="20" height="2" rx="1" />
              <rect y="15" width="20" height="2" rx="1" />
            </svg>
          </button>
        </div>

        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
