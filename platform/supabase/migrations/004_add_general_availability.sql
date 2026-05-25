ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avail_weekdays text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS avail_weekends text[] NOT NULL DEFAULT '{}';
