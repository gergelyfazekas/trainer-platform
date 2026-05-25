-- Add certificate columns to the profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS certificate_url TEXT,
  ADD COLUMN IF NOT EXISTS certificate_status TEXT NOT NULL DEFAULT 'none'
    CHECK (certificate_status IN ('none', 'pending', 'approved', 'rejected'));

-- Storage bucket 'trainer-certificates' must be created manually in the Supabase dashboard:
--   Dashboard → Storage → New bucket → name: "trainer-certificates" → Public: ON
--
-- Then add these RLS policies on the bucket:
--
--   Policy: "Trainers can upload their own certificate"
--     Operation: INSERT
--     Target roles: authenticated
--     USING: (bucket_id = 'trainer-certificates' AND (storage.foldername(name))[1] = auth.uid()::text)
--
--   Policy: "Trainers can update their own certificate"
--     Operation: UPDATE
--     Target roles: authenticated
--     USING: (bucket_id = 'trainer-certificates' AND (storage.foldername(name))[1] = auth.uid()::text)
