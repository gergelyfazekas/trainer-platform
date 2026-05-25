"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const CITIES = [
  { label: "Budapest", photo: "https://images.unsplash.com/photo-1541343672885-9be56236302a?w=400&q=80" },
  { label: "Debrecen", photo: "https://images.unsplash.com/photo-1601581987809-a874a81309c9?w=400&q=80" },
];

export function CityBar() {
  const [active, setActive] = useState(CITIES[0].label);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  function handleClick(label: string) {
    setActive(label);
    router.push(`/trainers?county=${encodeURIComponent(label)}`);
  }

  const scroll = (dir: number) => {
    scrollerRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <div className="bg-[var(--th-bg)]/95 border-b border-[var(--th-border)]">
      <div className="max-w-[1280px] mx-auto px-6 relative">
        <div ref={scrollerRef} className="flex gap-10 overflow-x-auto scrollbar-hide py-4">
          {CITIES.map((c) => (
            <button
              key={c.label}
              onClick={() => handleClick(c.label)}
              className={`shrink-0 flex flex-col items-center gap-2 group pb-2 border-b-2 transition-colors ${
                active === c.label
                  ? "border-[var(--th-fg)] opacity-100"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--th-muted)] grayscale group-hover:grayscale-0 transition">
                <img src={c.photo} alt={c.label} className="w-full h-full object-cover" />
              </div>
              <span className="text-[12px] font-medium text-[var(--th-fg)] whitespace-nowrap">{c.label}</span>
            </button>
          ))}
        </div>
        <button onClick={() => scroll(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-[var(--th-border)] hidden md:grid place-items-center hover:shadow-md">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button onClick={() => scroll(1)} className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-[var(--th-border)] hidden md:grid place-items-center hover:shadow-md">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}
