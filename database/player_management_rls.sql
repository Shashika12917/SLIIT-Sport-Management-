-- Player / Student Management - RLS & Helper Function
-- This file enables RLS and defines policies for:
-- - public.students
-- - public.players
-- - public.player_event_registrations

-- =====================================================================
-- Helper function to check if current user has player_management role
-- =====================================================================

create or replace function public.is_player_management()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'player_management'::public.user_role
  );
$$;


-- =====================================================================
-- Enable RLS on new tables
-- =====================================================================

alter table public.students
  enable row level security;

alter table public.players
  enable row level security;

alter table public.player_event_registrations
  enable row level security;

-- Enforce RLS even for table owners
alter table public.students
  force row level security;

alter table public.players
  force row level security;

alter table public.player_event_registrations
  force row level security;


-- =====================================================================
-- RLS for public.students
-- =====================================================================

-- Read access: only player_management users
create policy "Students select for player_management"
on public.students
for select
using ( public.is_player_management() );

-- Write access (insert/update/delete): only player_management users
create policy "Students write for player_management"
on public.students
for all
using ( public.is_player_management() )
with check ( public.is_player_management() );

-- If you later want all authenticated users to read students, you can add:
-- create policy "Students select for authenticated"
-- on public.students
-- for select
-- using ( auth.uid() is not null );


-- =====================================================================
-- RLS for public.players
-- =====================================================================

-- Read access: only player_management users
create policy "Players select for player_management"
on public.players
for select
using ( public.is_player_management() );

-- Write access: only player_management users
create policy "Players write for player_management"
on public.players
for all
using ( public.is_player_management() )
with check ( public.is_player_management() );

-- Alternative more permissive read policy (commented out):
-- create policy "Players select for authenticated"
-- on public.players
-- for select
-- using ( auth.uid() is not null );


-- =====================================================================
-- RLS for public.player_event_registrations
-- =====================================================================

-- Read participation history:
--   Current: only player_management users.
--   Alternative for all authenticated users is commented below.

create policy "Player event select for player_management"
on public.player_event_registrations
for select
using ( public.is_player_management() );

-- Alternative more permissive read policy:
-- create policy "Player event select for authenticated"
-- on public.player_event_registrations
-- for select
-- using ( auth.uid() is not null );


-- Write access (insert/update/delete registrations/results)
create policy "Player event write for player_management"
on public.player_event_registrations
for all
using ( public.is_player_management() )
with check ( public.is_player_management() );

