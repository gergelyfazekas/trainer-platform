"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PhotoUploadProps {
  userId: string;
  currentUrl: string | null;
  onUpload: (url: string) => void;
  label: string;
}

export function PhotoUpload({ userId, currentUrl, onUpload, label }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const ext = file.name.split(".").pop();
    const path = `${userId}/profile.${ext}`;
    const supabase = createClient();

    const { error: uploadError } = await supabase.storage
      .from("trainer-photos")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("trainer-photos").getPublicUrl(path);
    onUpload(data.publicUrl);
    setUploading(false);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[var(--th-fg)]">{label}</p>
      {currentUrl && (
        <img
          src={currentUrl}
          alt="Profilfotó"
          className="w-24 h-24 rounded-full object-cover border border-[var(--th-border)]"
        />
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-sm text-[var(--th-accent)] hover:underline disabled:opacity-50"
      >
        {uploading ? "Feltöltés…" : currentUrl ? "Csere" : "Feltöltés"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
