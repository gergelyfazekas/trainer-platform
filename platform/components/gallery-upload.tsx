"use client";

import { useRef, useState } from "react";
import { X, ImagePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface GalleryUploadProps {
  userId: string;
  photos: string[];
  onChange: (urls: string[]) => void;
}

export function GalleryUpload({ userId, photos, onChange }: GalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setError(null);

    const supabase = createClient();
    const newUrls: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${userId}/gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("trainer-photos")
        .upload(path, file, { upsert: false });

      if (uploadError) {
        setError(uploadError.message);
        continue;
      }

      const { data } = supabase.storage.from("trainer-photos").getPublicUrl(path);
      newUrls.push(data.publicUrl);
    }

    onChange([...photos, ...newUrls]);
    setUploading(false);
    e.target.value = "";
  }

  async function removePhoto(url: string) {
    const supabase = createClient();
    // Extract storage path from public URL
    const match = url.match(/trainer-photos\/(.+)$/);
    if (match) {
      await supabase.storage.from("trainer-photos").remove([match[1]]);
    }
    onChange(photos.filter((p) => p !== url));
  }

  return (
    <div className="space-y-3">
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((url) => (
            <div key={url} className="relative group aspect-square">
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover rounded-xl border border-[var(--th-border)]"
              />
              <button
                type="button"
                onClick={() => removePhoto(url)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-2 text-sm text-[var(--th-accent)] hover:underline disabled:opacity-50"
      >
        <ImagePlus className="w-4 h-4" />
        {uploading ? "Feltöltés…" : "Fotó hozzáadása"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
