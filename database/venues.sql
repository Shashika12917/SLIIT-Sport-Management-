-- =============================================================================
-- Sports Event Management: Venues & Bookings schema & RLS
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- =============================================================================

-- 0. Extensions (needed for exclusion constraints with uuid + range)
create extension if not exists btree_gist with schema public;


-- 1. Venue-related enums

create type public.venue_status as enum (
  'active',
  'inactive'
);

create type public.venue_booking_type as enum (
  'event',
  'maintenance',
  'blocked'
);


-- 2. Venues table

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  location text,
  capacity integer,
  surface_type text,
  status public.venue_status not null default 'active',
  open_time time not null default time '08:00',
  close_time time not null default time '22:00',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helpful indexes
create index venues_status_idx on public.venues (status);
create index venues_name_idx on public.venues (name);

-- Updated-at trigger (reuses the helper from profiles/events SQL)
create trigger venues_updated_at
  before update on public.venues
  for each row execute function public.set_updated_at();


-- 3. Venue bookings table (time-slot based availability and assignments)

create table public.venue_bookings (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete restrict,
  event_id uuid references public.events(id) on delete set null,
  booking_type public.venue_booking_type not null,
  booking_start timestamptz not null,
  booking_end timestamptz not null,
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Generated range column for overlap checks (half-open [start, end))
  booking_range tstzrange generated always as (
    tstzrange(booking_start, booking_end, '[)')
  ) stored,

  -- Basic sanity checks
  constraint venue_bookings_time_check check (booking_end > booking_start),
  constraint venue_bookings_event_check check (
    booking_type <> 'event' or event_id is not null
  )
);

-- Exclusion constraint to prevent double booking on the same venue
alter table public.venue_bookings
  add constraint venue_bookings_no_overlap
  exclude using gist (
    venue_id with =,
    booking_range with &&
  );

-- Helpful indexes for querying schedules
create index venue_bookings_venue_start_idx
  on public.venue_bookings (venue_id, booking_start);

-- Updated-at trigger
create trigger venue_bookings_updated_at
  before update on public.venue_bookings
  for each row execute function public.set_updated_at();


-- 4. Row Level Security

alter table public.venues enable row level security;
alter table public.venue_bookings enable row level security;

-- Venues: all authenticated users (and anon) can view
create policy "Public can view venues"
  on public.venues
  for select
  to authenticated, anon
  using (true);

-- Venues: venue_management role can manage
create policy "Venue management role can manage venues"
  on public.venues
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'venue_management'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'venue_management'
    )
    and created_by = auth.uid()
  );

-- Venue bookings: anyone authenticated can view schedules
create policy "Authenticated users can view venue bookings"
  on public.venue_bookings
  for select
  to authenticated
  using (true);

-- Optionally expose read-only schedules to anon clients as well
create policy "Anon can view venue bookings"
  on public.venue_bookings
  for select
  to anon
  using (true);

-- Venue bookings: venue_management and event_management can manage
create policy "Venue & event management can manage bookings"
  on public.venue_bookings
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('venue_management', 'event_management')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('venue_management', 'event_management')
    )
    and created_by = auth.uid()
  );


-- 5. Grants

-- Venues
grant select on public.venues to anon;
grant select on public.venues to authenticated;
grant insert, update, delete on public.venues to authenticated;
grant all on public.venues to service_role;

-- Venue bookings
grant select on public.venue_bookings to anon;
grant select, insert, update, delete on public.venue_bookings to authenticated;
grant all on public.venue_bookings to service_role;


-- =============================================================================
-- Notes:
-- - Double booking prevention is handled by the venue_bookings_no_overlap
--   exclusion constraint on (venue_id, booking_range).
-- - Capacity is informational; enforcement (e.g. warnings) should be done in
--   the application layer.
-- - booking_type = 'event' rows are the canonical link between events and
--   venues for specific time slots.
-- =============================================================================

