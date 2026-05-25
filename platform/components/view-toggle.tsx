"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Map, List } from "lucide-react";

export function ViewToggle({ currentView }: { currentView: "list" | "map" }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function switchTo(view: "list" | "map") {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "list") params.delete("view");
    else params.set("view", "map");
    router.push(`/trainers?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => switchTo("list")}
        className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
          currentView === "list" ? "text-[var(--th-accent)]" : "text-[var(--th-fg-muted)] hover:text-[var(--th-fg)]"
        }`}
      >
        <List className="w-4 h-4" />
        Listás nézet
      </button>
      <span className="text-gray-300">|</span>
      <button
        type="button"
        onClick={() => switchTo("map")}
        className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
          currentView === "map" ? "text-[var(--th-accent)]" : "text-[var(--th-fg-muted)] hover:text-[var(--th-fg)]"
        }`}
      >
        <Map className="w-4 h-4" />
        Térképes nézet
      </button>
    </div>
  );
}
