create table public.packages (
  id uuid primary key default uuid_generate_v4(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  price integer not null default 0,
  sessions integer,
  duration_min integer,
  is_popular boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.packages enable row level security;

create policy "Trainers manage own packages"
  on public.packages for all
  using (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());

create policy "Public can view packages"
  on public.packages for select
  using (true);
