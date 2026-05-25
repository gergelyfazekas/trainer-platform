"use client";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

export function MobileFilterToggle({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full md:w-56 md:shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="md:hidden flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border border-[var(--th-border)] bg-white text-[var(--th-fg)] hover:bg-[var(--th-muted)] transition-colors mb-3"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Szűrők
        {open ? <X className="w-3.5 h-3.5 ml-auto" /> : null}
      </button>
      <div className={`${open ? "block" : "hidden"} md:block`}>{children}</div>
    </div>
  );
}
