"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { hu } from "@/messages/hu";


const BASE_LOCATIONS = [
  // Budapest districts
  "Budapest I. kerület", "Budapest II. kerület", "Budapest III. kerület",
  "Budapest IV. kerület", "Budapest V. kerület", "Budapest VI. kerület",
  "Budapest VII. kerület", "Budapest VIII. kerület", "Budapest IX. kerület",
  "Budapest X. kerület", "Budapest XI. kerület", "Budapest XII. kerület",
  "Budapest XIII. kerület", "Budapest XIV. kerület", "Budapest XV. kerület",
  "Budapest XVI. kerület", "Budapest XVII. kerület", "Budapest XVIII. kerület",
  "Budapest XIX. kerület", "Budapest XX. kerület", "Budapest XXI. kerület",
  "Budapest XXII. kerület", "Budapest XXIII. kerület",
  // Named Budapest neighbourhoods
  "Belváros, Budapest", "Lipótváros, Budapest", "Terézváros, Budapest",
  "Erzsébetváros, Budapest", "Józsefváros, Budapest", "Ferencváros, Budapest",
  "Zugló, Budapest", "Kelenföld, Budapest", "Újbuda, Budapest",
  "Óbuda, Budapest", "Angyalföld, Budapest", "Újpest, Budapest",
  "Rákospalota, Budapest", "Csepel, Budapest", "Pesterzsébet, Budapest",
  "Soroksár, Budapest", "Kispest, Budapest", "Kőbánya, Budapest",
  "Budafok, Budapest",
  // Major cities
  "Budapest", "Debrecen", "Miskolc", "Pécs", "Győr", "Nyíregyháza",
  "Kecskemét", "Székesfehérvár", "Szombathely", "Szolnok", "Tatabánya",
  "Kaposvár", "Érd", "Sopron", "Eger", "Veszprém", "Zalaegerszeg",
  "Nagykanizsa", "Dunaújváros", "Hódmezővásárhely", "Szeged", "Ózd",
  "Salgótarján", "Cegléd", "Szekszárd", "Békéscsaba", "Esztergom",
  "Budaörs", "Mosonmagyaróvár", "Gödöllő", "Jászberény", "Pápa",
  "Dunakeszi", "Vác", "Gyöngyös", "Siófok", "Baja", "Orosháza",
  "Gyula", "Makó", "Hajdúböszörmény", "Hajdúszoboszló", "Balassagyarmat",
  "Hatvan", "Keszthely", "Tapolca", "Ajka", "Paks", "Sárvár",
  "Szigetvár", "Kalocsa", "Szentes", "Kisvárda", "Mór", "Komárom",
  "Kazincbarcika", "Tiszaújváros",
];

interface SearchBarProps {
  initialCity?: string;
  initialMinRate?: string;
  initialMaxRate?: string;
  size?: "lg" | "sm";
  trainerCities?: string[];
}

export function SearchBar({
  initialCity = "",
  initialMinRate = "",
  initialMaxRate = "",
  size = "lg",
  trainerCities = [],
}: SearchBarProps) {
  const router = useRouter();
  const [city, setCity] = useState(initialCity);
  const [minRate, setMinRate] = useState(initialMinRate);
  const [maxRate, setMaxRate] = useState(initialMaxRate);
  const [focus, setFocus] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const cityRef = useRef<HTMLDivElement>(null);

  // Merge base list with trainer-supplied cities, deduplicated
  const allLocations = [
    ...BASE_LOCATIONS,
    ...trainerCities.filter((c) => c && !BASE_LOCATIONS.includes(c)),
  ];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setSuggestions([]);
        setActiveIdx(-1);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleCityChange(val: string) {
    setCity(val);
    setActiveIdx(-1);
    const trimmed = val.trim();
    if (trimmed.length < 2) { setSuggestions([]); return; }
    const lower = trimmed.toLowerCase();
    setSuggestions(allLocations.filter((loc) => loc.toLowerCase().includes(lower)).slice(0, 8));
  }

  function selectSuggestion(val: string) {
    setCity(val);
    setSuggestions([]);
    setActiveIdx(-1);
  }

  function handleCityKeyDown(e: React.KeyboardEvent) {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); selectSuggestion(suggestions[activeIdx]); }
    else if (e.key === "Escape") { setSuggestions([]); setActiveIdx(-1); }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuggestions([]);
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (minRate) params.set("minRate", minRate);
    if (maxRate) params.set("maxRate", maxRate);
    router.push(`/trainers?${params.toString()}`);
  }

  const pad = size === "lg" ? "py-3.5" : "py-2.5";
  const segBase = `px-5 ${pad} cursor-text transition-colors hover:bg-[var(--th-muted)]/60`;

  return (
    <form
      onSubmit={handleSubmit}
      className="inline-flex items-stretch bg-white rounded-full border border-[var(--th-border)] shadow-[0_6px_32px_-8px_rgba(0,0,0,0.16),0_2px_8px_-4px_rgba(0,0,0,0.06)] text-[14px] overflow-visible w-full max-w-4xl"
    >
      {/* Lokáció */}
      <div
        ref={cityRef}
        className={`relative flex-1 min-w-0 ${segBase} ${focus === "city" ? "bg-[var(--th-muted)]/60" : ""}`}
      >
        <div className="text-[11px] font-semibold text-[var(--th-fg)] uppercase tracking-wider">Lokáció</div>
        <input
          value={city}
          onChange={(e) => handleCityChange(e.target.value)}
          onFocus={() => setFocus("city")}
          onBlur={() => setFocus(null)}
          onKeyDown={handleCityKeyDown}
          placeholder="Város vagy kerület…"
          autoComplete="off"
          className="bg-transparent outline-none w-full placeholder:text-[var(--th-fg-muted)] text-[var(--th-fg)]"
        />
        {suggestions.length > 0 && (
          <ul className="absolute left-0 top-full mt-2 w-full min-w-[220px] bg-white border border-[var(--th-border)] rounded-2xl shadow-xl z-50 overflow-hidden">
            {suggestions.map((s, i) => (
              <li
                key={s}
                onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                  i === activeIdx
                    ? "bg-[var(--th-accent)] text-white"
                    : "text-[var(--th-fg)] hover:bg-[var(--th-muted)]"
                }`}
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0 opacity-50" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="w-px bg-[var(--th-border)] self-center h-8 shrink-0" />

      {/* Price */}
      <div className={`${segBase} ${focus === "min" || focus === "max" ? "bg-[var(--th-muted)]/60" : ""}`}>
        <div className="text-[11px] font-semibold text-[var(--th-fg)] uppercase tracking-wider">Óradíj (Ft)</div>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            value={minRate}
            onChange={(e) => setMinRate(e.target.value)}
            onFocus={() => setFocus("min")}
            onBlur={() => setFocus(null)}
            placeholder="Min"
            className="bg-transparent outline-none w-16 placeholder:text-[var(--th-fg-muted)] text-[var(--th-fg)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-[var(--th-fg-muted)] text-xs">–</span>
          <input
            type="number"
            min={0}
            value={maxRate}
            onChange={(e) => setMaxRate(e.target.value)}
            onFocus={() => setFocus("max")}
            onBlur={() => setFocus(null)}
            placeholder="Max"
            className="bg-transparent outline-none w-16 placeholder:text-[var(--th-fg-muted)] text-[var(--th-fg)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="p-1.5 shrink-0">
        <button
          type="submit"
          className="h-full px-8 rounded-full bg-[var(--th-accent)] hover:brightness-95 text-[var(--th-accent-fg)] font-medium flex items-center gap-2 transition-all"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
          </svg>
          <span className="hidden sm:inline">{hu.search.button}</span>
        </button>
      </div>
    </form>
  );
}
