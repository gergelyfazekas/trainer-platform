"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface GymOption {
  name: string;
  city: string;
}

interface ComboboxChipsProps {
  options: GymOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function ComboboxChips({
  options,
  value,
  onChange,
  placeholder = "Keresés…",
}: ComboboxChipsProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, []);

  const filtered = options.filter(
    (o) =>
      !value.includes(o.name) &&
      (o.name.toLowerCase().includes(query.toLowerCase()) ||
        o.city.toLowerCase().includes(query.toLowerCase()))
  );

  function select(item: GymOption) {
    if (!value.includes(item.name)) onChange([...value, item.name]);
    setQuery("");
    setOpen(false);
  }

  function remove(item: string) {
    onChange(value.filter((v) => v !== item));
  }

  function addCustom() {
    const trimmed = customInput.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setCustomInput("");
    setShowCustomInput(false);
  }

  return (
    <div ref={containerRef} className="relative">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 text-sm px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200"
            >
              {v}
              <button type="button" onClick={() => remove(v)} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {showCustomInput && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
            placeholder="Edzőterem neve…"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            type="button"
            onClick={addCustom}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300"
          >
            Hozzáad
          </button>
        </div>
      )}

      {!showCustomInput && (
        <button
          type="button"
          onClick={() => setShowCustomInput(true)}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          + Edzőterem hozzáadása
        </button>
      )}

      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.map((o) => (
            <li
              key={o.name}
              onMouseDown={(e) => { e.preventDefault(); select(o); }}
              className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
            >
              <span>{o.name}</span>
              <span className="text-xs text-gray-400">{o.city}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
