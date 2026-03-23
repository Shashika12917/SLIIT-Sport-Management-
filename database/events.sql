-- =============================================================================
-- Sports Event Management: Events schema & RLS
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- =============================================================================

-- 1. Event status enum
--    Keep this minimal and focused on internal lifecycle.
create type public.event_status as enum (
  'planned',
  'active',
  'completed',
  'cancelled'
);


-- 2. Events table
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_date date not null,
  venue text not null,
  sport_type text not null,
  status public.event_status not null default 'planned',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Prevent obvious duplicates for the same sport at the same venue on the same date.
  constraint events_unique_schedule unique (event_date, venue, sport_type)
);


-- 3. Helpful indexes
-- Upcoming events and calendar views
create index events_event_date_idx on public.events (event_date);
-- Optional status filter (e.g. active / planned)
create index events_status_idx on public.events (status);


-- 4. Updated-at trigger (reuses the helper from 001_profiles_roles_rls.sql)
create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();


-- 5. Row Level Security
alter table public.events enable row level security;

-- All authenticated users can view events (list / details).
create policy "Authenticated users can view events"
  on public.events
  for select
  to authenticated
  using (true);

-- Only users with role = 'event_management' in profiles can create/update/cancel.
create policy "Event management role can manage events"
  on public.events
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'event_management'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'event_management'
    )
    -- Ensure created_by is always the acting user on insert.
    and (created_by = auth.uid())
  );


-- 6. Grants
-- Allow dashboard clients (anon/authenticated) to read events; RLS still applies.
grant select on public.events to anon;
grant select on public.events to authenticated;

-- Only authenticated (subject to RLS) can modify events.
grant insert, update, delete on public.events to authenticated;

-- Full control for service role (bypasses RLS when using service key).
grant all on public.events to service_role;

-- =============================================================================
-- Notes:
-- - Duplicate prevention is handled by the events_unique_schedule constraint.
-- - Date validation (e.g. disallow past dates) is best handled in the app layer
--   so you can still keep historical/completed events in the database.
-- =============================================================================

