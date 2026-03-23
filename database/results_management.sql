-- =============================================================================
-- Sports Event Management: Match Results & Performance schema & RLS
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- =============================================================================

-- 1. Match status enum
--    Separate from event_status to reflect lifecycle of individual matches.
--    Note: PostgreSQL does not support IF NOT EXISTS for types in all versions,
--    so this will error if the type already exists. Run it only once, or
--    remove it if match_status is already created.
create type public.match_status as enum (
  'scheduled',
  'completed',
  'cancelled'
);


-- 2. Matches table
--    One record per match/fixture, typically linked to an event.
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),

  event_id uuid not null
    references public.events (id)
    on delete restrict,

  venue_id uuid null
    references public.venues (id)
    on delete set null,

  match_date timestamptz not null default now(),

  status public.match_status not null default 'scheduled',

  -- League / knockout / friendly, etc.
  match_type text null,

  notes text null,

  winner_team_id uuid null
    references public.teams (id)
    on delete set null,

  created_by uuid not null
    references auth.users (id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists matches_event_idx
  on public.matches (event_id);

create index if not exists matches_date_idx
  on public.matches (match_date);

create index if not exists matches_status_idx
  on public.matches (status);

create index if not exists matches_winner_team_idx
  on public.matches (winner_team_id);

-- Updated-at trigger (reuses shared set_updated_at())
drop trigger if exists matches_updated_at on public.matches;

create trigger matches_updated_at
before update on public.matches
for each row
execute function set_updated_at();


-- 3. Match teams table
--    Participating teams per match with generic scores.
create table if not exists public.match_teams (
  id uuid primary key default gen_random_uuid(),

  match_id uuid not null
    references public.matches (id)
    on delete cascade,

  team_id uuid not null
    references public.teams (id)
    on delete restrict,

  -- Generic numeric score (goals, points, runs, etc.)
  score integer null,

  -- Optional sport-specific details (sets, overs, penalties, etc.)
  extra_info jsonb null,

  -- Convenience flag; should be kept in sync with winner_team_id on matches.
  is_winner boolean not null default false,

  created_by uuid not null
    references auth.users (id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint match_teams_unique_team_per_match unique (match_id, team_id)
);

create index if not exists match_teams_match_idx
  on public.match_teams (match_id);

create index if not exists match_teams_team_idx
  on public.match_teams (team_id);

drop trigger if exists match_teams_updated_at on public.match_teams;

create trigger match_teams_updated_at
before update on public.match_teams
for each row
execute function set_updated_at();


-- 4. Match player stats table
--    Optional per-player performance per match.
create table if not exists public.match_player_stats (
  id uuid primary key default gen_random_uuid(),

  match_id uuid not null
    references public.matches (id)
    on delete cascade,

  team_id uuid not null
    references public.teams (id)
    on delete restrict,

  player_id uuid not null
    references public.players (id)
    on delete restrict,

  minutes_played integer null,
  points_scored integer null,
  rating numeric(3, 1) null,

  -- Flexible, sport-specific metrics (goals, assists, wickets, etc.)
  metrics jsonb null,

  created_by uuid not null
    references auth.users (id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint match_player_unique_per_match unique (match_id, player_id)
);

create index if not exists match_player_stats_match_idx
  on public.match_player_stats (match_id);

create index if not exists match_player_stats_player_idx
  on public.match_player_stats (player_id);

create index if not exists match_player_stats_team_idx
  on public.match_player_stats (team_id);

drop trigger if exists match_player_stats_updated_at on public.match_player_stats;

create trigger match_player_stats_updated_at
before update on public.match_player_stats
for each row
execute function set_updated_at();


-- 5. Row Level Security

alter table public.matches enable row level security;
alter table public.match_teams enable row level security;
alter table public.match_player_stats enable row level security;

-- Helper condition: user has a management role that can manage results.
-- This mirrors patterns used in events/venues/society/team management.
create or replace function public.has_results_management_role()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in (
        'results_management',
        'event_management',
        'society_management',
        'player_management'
      )
  );
$$;

-- Matches: anyone can view (subject to anon/auth separation), managers can write.
create policy "Public can view matches"
  on public.matches
  for select
  to authenticated, anon
  using (true);

create policy "Results management roles can manage matches"
  on public.matches
  for all
  to authenticated
  using (public.has_results_management_role())
  with check (
    public.has_results_management_role()
    and created_by = auth.uid()
  );

-- Match teams: view for everyone, write for management roles.
create policy "Public can view match teams"
  on public.match_teams
  for select
  to authenticated, anon
  using (true);

create policy "Results management roles can manage match teams"
  on public.match_teams
  for all
  to authenticated
  using (public.has_results_management_role())
  with check (public.has_results_management_role());

-- Match player stats: view for everyone, write for management roles.
create policy "Public can view match player stats"
  on public.match_player_stats
  for select
  to authenticated, anon
  using (true);

create policy "Results management roles can manage match player stats"
  on public.match_player_stats
  for all
  to authenticated
  using (public.has_results_management_role())
  with check (public.has_results_management_role());


-- 6. Grants

grant select on public.matches to anon;
grant select on public.matches to authenticated;
grant insert, update, delete on public.matches to authenticated;
grant all on public.matches to service_role;

grant select on public.match_teams to anon;
grant select, insert, update, delete on public.match_teams to authenticated;
grant all on public.match_teams to service_role;

grant select on public.match_player_stats to anon;
grant select, insert, update, delete on public.match_player_stats to authenticated;
grant all on public.match_player_stats to service_role;


-- =============================================================================
-- Notes:
-- - This schema is intentionally generic so it can support many sports.
-- - Winner calculation should be handled in the application layer, which
--   will then set winner_team_id on matches and is_winner on match_teams.
-- - Leaderboards can be built using aggregated queries over matches,
--   match_teams, and match_player_stats, or via separate SQL views if
--   needed later for performance.
-- =============================================================================

