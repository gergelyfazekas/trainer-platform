"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, X } from "lucide-react";

const AVAIL_DAYS = [
  { value: "weekdays", label: "Hétköznapok", sub: "H–P" },
  { value: "weekends", label: "Hétvége", sub: "Szo–V" },
] as const;

const AVAIL_TIMES = [
  { value: "morning", label: "Reggel", sub: "6–12" },
  { value: "daytime", label: "Napközben", sub: "12–17" },
  { value: "evening", label: "Este", sub: "17–22" },
] as const;

interface FilterSidebarProps {
  initialCity?: string;
  initialMinRate?: string;
  initialMaxRate?: string;
  initialGyms?: string[];
  gymOptions?: string[];
  initialLanguages?: string[];
  languageOptions?: string[];
  initialAvailDays?: string[];
  initialAvailTimes?: string[];
}

export function FilterSidebar({
  initialCity = "",
  initialMinRate = "",
  initialMaxRate = "",
  initialGyms = [],
  gymOptions = [],
  initialLanguages = [],
  languageOptions = [],
  initialAvailDays = [],
  initialAvailTimes = [],
}: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(initialCity);
  const [minRate, setMinRate] = useState(initialMinRate);
  const [maxRate, setMaxRate] = useState(initialMaxRate);
  const [selectedGyms, setSelectedGyms] = useState<string[]>(initialGyms);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(initialLanguages);
  const [selectedAvailDays, setSelectedAvailDays] = useState<string[]>(initialAvailDays);
  const [selectedAvailTimes, setSelectedAvailTimes] = useState<string[]>(initialAvailTimes);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    price: true,
    location: true,
    gyms: true,
    languages: true,
    availability: true,
  });

  function toggleSection(key: string) {
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  }

  function toggleGym(name: string) {
    setSelectedGyms((prev) =>
      prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name]
    );
  }

  function toggleLanguage(lang: string) {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  }

  function toggleAvailDay(val: string) {
    setSelectedAvailDays((prev) =>
      prev.includes(val) ? prev.filter((d) => d !== val) : [...prev, val]
    );
  }

  function toggleAvailTime(val: string) {
    setSelectedAvailTimes((prev) =>
      prev.includes(val) ? prev.filter((t) => t !== val) : [...prev, val]
    );
  }

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());
    city ? params.set("city", city) : params.delete("city");
    minRate ? params.set("minRate", minRate) : params.delete("minRate");
    maxRate ? params.set("maxRate", maxRate) : params.delete("maxRate");
    selectedGyms.length > 0 ? params.set("gyms", selectedGyms.join(",")) : params.delete("gyms");
    selectedLanguages.length > 0 ? params.set("langs", selectedLanguages.join(",")) : params.delete("langs");
    selectedAvailDays.length > 0 ? params.set("availDays", selectedAvailDays.join(",")) : params.delete("availDays");
    selectedAvailTimes.length > 0 ? params.set("availTimes", selectedAvailTimes.join(",")) : params.delete("availTimes");
    router.push(`/trainers?${params.toString()}`);
  }

  function clearFilters() {
    setCity("");
    setMinRate("");
    setMaxRate("");
    setSelectedGyms([]);
    setSelectedLanguages([]);
    setSelectedAvailDays([]);
    setSelectedAvailTimes([]);
    const params = new URLSearchParams(searchParams.toString());
    ["city", "minRate", "maxRate", "gyms", "langs", "availDays", "availTimes"].forEach((k) => params.delete(k));
    router.push(`/trainers?${params.toString()}`);
  }

  const hasActiveFilters = !!(city || minRate || maxRate || selectedGyms.length > 0 || selectedLanguages.length > 0 || selectedAvailDays.length > 0 || selectedAvailTimes.length > 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">Szűrők</span>
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="text-xs text-blue-600 hover:underline">
            Törlés
          </button>
        )}
      </div>

      <Section label="Árak" open={openSections.price} onToggle={() => toggleSection("price")}>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Minimum (Ft)</label>
            <input
              type="number"
              min={0}
              value={minRate}
              onChange={(e) => setMinRate(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder="pl. 5 000"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Maximum (Ft)</label>
            <input
              type="number"
              min={0}
              value={maxRate}
              onChange={(e) => setMaxRate(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder="pl. 20 000"
              className={inputClass}
            />
          </div>
        </div>
      </Section>

      <Section label="Helyszín" open={openSections.location} onToggle={() => toggleSection("location")}>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Város</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder="pl. Budapest"
            className={inputClass}
          />
        </div>
      </Section>

      {gymOptions.length > 0 && (
        <Section label="Edzőterem" open={openSections.gyms} onToggle={() => toggleSection("gyms")}>
          <MultiSelect
            options={gymOptions}
            selected={selectedGyms}
            onToggle={toggleGym}
            placeholder="Válassz edzőtermet…"
          />
        </Section>
      )}

      {languageOptions.length > 0 && (
        <Section label="Nyelv" open={openSections.languages} onToggle={() => toggleSection("languages")}>
          <MultiSelect
            options={languageOptions}
            selected={selectedLanguages}
            onToggle={toggleLanguage}
            placeholder="Válassz nyelvet…"
          />
        </Section>
      )}

      <Section label="Elérhetőség" open={openSections.availability} onToggle={() => toggleSection("availability")}>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-2">Mikor</p>
            <div className="space-y-1.5">
              {AVAIL_DAYS.map((d) => (
                <label key={d.value} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedAvailDays.includes(d.value)}
                    onChange={() => toggleAvailDay(d.value)}
                    className="w-4 h-4 rounded accent-[var(--th-accent)] cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {d.label}
                    <span className="text-gray-400 ml-1.5 text-xs">{d.sub}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Napszak</p>
            <div className="space-y-1.5">
              {AVAIL_TIMES.map((t) => (
                <label key={t.value} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedAvailTimes.includes(t.value)}
                    onChange={() => toggleAvailTime(t.value)}
                    className="w-4 h-4 rounded accent-[var(--th-accent)] cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {t.label}
                    <span className="text-gray-400 ml-1.5 text-xs">{t.sub}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <div className="px-4 py-3">
        <button
          type="button"
          onClick={applyFilters}
          className="w-full bg-[var(--th-accent)] hover:brightness-95 text-[var(--th-accent-fg)] text-sm font-medium rounded-lg py-2 transition-all"
        >
          Szűrés
        </button>
      </div>
    </div>
  );
}

function MultiSelect({ options, selected, onToggle, placeholder }: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selected.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {s}
              <button type="button" onClick={() => onToggle(s)} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm text-left hover:border-gray-300 transition-colors"
      >
        <span className={selected.length === 0 ? "text-gray-400" : "text-gray-700"}>
          {selected.length === 0 ? placeholder : `${selected.length} kiválasztva`}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <li
              key={opt}
              onMouseDown={(e) => { e.preventDefault(); onToggle(opt); }}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected.includes(opt) ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                {selected.includes(opt) && (
                  <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                )}
              </span>
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Section({ label, open, onToggle, children }: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {label}
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
