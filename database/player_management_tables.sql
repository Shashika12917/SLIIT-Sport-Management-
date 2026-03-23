-- Player / Student Management - Tables & Triggers
-- This file defines core tables for:
-- - Student registry with unique student IDs
-- - Player profiles linked to students
-- - Event registrations / participation history

-- =====================================================================
-- 1. Student registry: master list of students with unique Student ID
-- =====================================================================

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),

  -- University-issued unique student identifier (e.g., ITxxxxxxxx)
  student_id text not null unique,

  full_name text not null,
  email text null,
  faculty text null,
  batch text null,
  index_no text null,
  active boolean not null default true,

  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Helpful lookup indexes (optional but recommended)
create index if not exists students_full_name_idx
  on public.students using btree (full_name);

create index if not exists students_email_idx
  on public.students using btree (email);

-- Maintain updated_at automatically (reuses shared set_updated_at())
drop trigger if exists students_updated_at on public.students;

create trigger students_updated_at
before update on public.students
for each row
execute function set_updated_at();


-- =====================================================================
-- 2. Player profiles linked to student registry
-- =====================================================================

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),

  -- Reference into students registry (not the textual student_id)
  student_id uuid not null
    references public.students (id)
    on delete restrict,

  sport text not null,
  position text null,
  jersey_no integer null,
  team_name text null,

  date_of_birth date null,
  gender text null,
  contact_no text null,

  created_by uuid not null
    references auth.users (id)
    on delete restrict,

  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- One profile per student per sport
  constraint players_student_sport_unique unique (student_id, sport)
);

create index if not exists players_student_id_idx
  on public.players using btree (student_id);

create index if not exists players_sport_idx
  on public.players using btree (sport);

drop trigger if exists players_updated_at on public.players;

create trigger players_updated_at
before update on public.players
for each row
execute function set_updated_at();


-- =====================================================================
-- 3. Event registrations / participation history
-- =====================================================================

create table if not exists public.player_event_registrations (
  id uuid primary key default gen_random_uuid(),

  player_id uuid not null
    references public.players (id)
    on delete cascade,

  event_id uuid not null
    references public.events (id)
    on delete restrict,

  -- Status of registration / participation
  registration_status text not null default 'registered',

  -- Flexible result / performance details (time, score, rank, etc.)
  result text null,
  performance jsonb null,
  notes text null,

  registered_at timestamp with time zone not null default now(),

  created_by uuid not null
    references auth.users (id)
    on delete restrict,

  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Prevent duplicate registration for same player and event
  constraint player_event_unique unique (player_id, event_id)
);

create index if not exists player_event_registrations_player_idx
  on public.player_event_registrations using btree (player_id);

create index if not exists player_event_registrations_event_status_idx
  on public.player_event_registrations using btree (event_id, registration_status);

drop trigger if exists player_event_registrations_updated_at
  on public.player_event_registrations;

create trigger player_event_registrations_updated_at
before update on public.player_event_registrations
for each row
execute function set_updated_at();

