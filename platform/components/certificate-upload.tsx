"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
  currentUrl: string | null;
  currentStatus: string;
}

const STATUS_CONFIG = {
  none:     { label: "Nem feltöltött",    color: "text-[var(--th-fg-muted)]" },
  pending:  { label: "Ellenőrzés alatt",  color: "text-amber-600" },
  approved: { label: "Ellenőrzött ✓",    color: "text-emerald-600" },
  rejected: { label: "Visszautasítva",    color: "text-red-500" },
} as const;

export function CertificateUpload({ userId, currentUrl, currentStatus }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState(currentStatus);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const ext = file.name.split(".").pop();
    const path = `${userId}/certificate.${ext}`;
    const supabase = createClient();

    const { error: uploadError } = await supabase.storage
      .from("trainer-certificates")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("trainer-certificates").getPublicUrl(path);

    const res = await fetch("/api/certificates/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ certificate_url: data.publicUrl }),
    });

    if (!res.ok) {
      setError("Értesítés sikertelen, próbáld újra.");
      setUploading(false);
      return;
    }

    setStatus("pending");
    setUploading(false);
    // Reset so the same file can be re-selected if needed
    if (inputRef.current) inputRef.current.value = "";
  }

  const { label, color } = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.none;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--th-fg)]">Edzői tanúsítvány</p>
        <span className={`text-[13px] font-medium ${color}`}>{label}</span>
      </div>
      <p className="text-[13px] text-[var(--th-fg-muted)] leading-relaxed">
        Töltsd fel edzői oklevelét vagy tanúsítványodat (JPG, PNG vagy PDF).
        Ellenőrzés után megjelenik az „Ellenőrzött edző" jelvény a profilodon.
      </p>
      {currentUrl && status !== "none" && (
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-[13px] text-[var(--th-accent)] hover:underline"
        >
          Feltöltött dokumentum megtekintése ↗
        </a>
      )}
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-sm text-[var(--th-accent)] hover:underline disabled:opacity-50"
        >
          {uploading ? "Feltöltés…" : status === "none" ? "Tanúsítvány feltöltése" : "Újra feltöltés"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleChange}
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
