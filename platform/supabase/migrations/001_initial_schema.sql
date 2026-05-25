-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  bio text,
  city text,
  county text,
  latitude double precision,
  longitude double precision,
  business_name text,
  tax_id text,
  specialties text[] default '{}',
  hourly_rate integer,
  profile_photo text,
  gallery_photos text[] default '{}',
  is_active boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.availability_slots (
  id uuid primary key default uuid_generate_v4(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);

create table public.bookings (
  id uuid primary key default uuid_generate_v4(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  visitor_name text not null,
  visitor_email text not null,
  visitor_phone text,
  appointment_at timestamptz not null,
  duration_min integer not null default 60,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  sender_name text not null,
  sender_email text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  trainer_id uuid not null unique references public.profiles(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  stripe_price_id text not null,
  plan text not null check (plan in ('basic', 'featured')),
  status text not null check (status in ('active', 'past_due', 'cancelled', 'trialing')),
  current_period_end timestamptz not null
);

-- ============================================================
-- TRIGGER: auto-create profile row on auth.users insert
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRIGGER: auto-update updated_at on profiles
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.availability_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.messages enable row level security;
alter table public.subscriptions enable row level security;

-- profiles: anyone can read active profiles
create policy "Public can read active profiles"
  on public.profiles for select
  using (is_active = true);

-- profiles: trainers can always read their own row
create policy "Trainers read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- profiles: trainers can update their own row (not is_active / is_featured — controlled by service role via webhook)
create policy "Trainers update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- availability_slots: trainers read/write own rows
create policy "Trainers read own slots"
  on public.availability_slots for select
  using (auth.uid() = trainer_id);

create policy "Trainers insert own slots"
  on public.availability_slots for insert
  with check (auth.uid() = trainer_id);

create policy "Trainers update own slots"
  on public.availability_slots for update
  using (auth.uid() = trainer_id);

create policy "Trainers delete own slots"
  on public.availability_slots for delete
  using (auth.uid() = trainer_id);

-- availability_slots: public can read slots for active trainers (for booking page)
create policy "Public reads slots of active trainers"
  on public.availability_slots for select
  using (
    exists (
      select 1 from public.profiles
      where id = trainer_id and is_active = true
    )
  );

-- bookings: trainers read/manage their own bookings
create policy "Trainers read own bookings"
  on public.bookings for select
  using (auth.uid() = trainer_id);

create policy "Trainers update own bookings"
  on public.bookings for update
  using (auth.uid() = trainer_id);

-- bookings: public can insert (visitors booking without accounts)
create policy "Public insert bookings"
  on public.bookings for insert
  with check (true);

-- messages: trainers read/manage their own messages
create policy "Trainers read own messages"
  on public.messages for select
  using (auth.uid() = trainer_id);

create policy "Trainers update own messages"
  on public.messages for update
  using (auth.uid() = trainer_id);

-- messages: public can insert (visitors sending messages without accounts)
create policy "Public insert messages"
  on public.messages for insert
  with check (true);

-- subscriptions: trainers read own subscription
create policy "Trainers read own subscription"
  on public.subscriptions for select
  using (auth.uid() = trainer_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

insert into storage.buckets (id, name, public)
values ('trainer-photos', 'trainer-photos', true)
on conflict do nothing;

-- Storage policy: trainers can upload to their own folder
create policy "Trainers upload own photos"
  on storage.objects for insert
  with check (
    bucket_id = 'trainer-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Trainers update own photos"
  on storage.objects for update
  using (
    bucket_id = 'trainer-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Trainers delete own photos"
  on storage.objects for delete
  using (
    bucket_id = 'trainer-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policy: public read for trainer-photos bucket
create policy "Public read trainer photos"
  on storage.objects for select
  using (bucket_id = 'trainer-photos');

-- Grant anon role INSERT on public-facing tables (RLS policies alone are not enough)
grant insert on public.bookings to anon;
grant insert on public.messages to anon;
