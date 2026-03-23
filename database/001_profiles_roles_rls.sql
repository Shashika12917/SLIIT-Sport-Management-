-- =============================================================================
-- Sports Event Management: Profiles, Roles & RLS
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- =============================================================================

-- 1. Custom role type (matches your 5 management roles)
create type public.user_role as enum (
  'event_management',
  'society_management',
  'player_management',
  'venue_management',
  'results_management'
);

-- 2. Profiles table (one row per auth user, stores role)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'player_management',
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Index for lookups by role (optional, useful for admin lists)
create index profiles_role_idx on public.profiles(role);

-- 4. Trigger: create profile on signup (optional but recommended)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email,
    'player_management'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. RLS: enable on profiles
alter table public.profiles enable row level security;

-- 6. RLS policies (subtle: users see only their own row; no cross-user access)

-- Users can read their own profile only
create policy "Users can read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Users can update their own profile (e.g. full_name, avatar); role updates
-- can be restricted to service role or an admin table later
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Only the trigger (and thus auth insert) creates profiles; no direct insert from anon.
-- So we do not grant insert to authenticated users. Service role can insert/update
-- for admin assignment of roles. If you want users to never insert, omit this.
-- Optionally allow insert so that first login can create profile if trigger missed:
create policy "Users can insert own profile once"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- No delete for users (only service role / admin can delete profiles if needed)
-- So we do not add a delete policy for authenticated users.

-- 7. Optional: grant usage to authenticated and service role
grant usage on schema public to authenticated;
grant usage on schema public to service_role;
grant select, update, insert on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- 8. Optional: updated_at trigger
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
  for each row execute function public.set_updated_at();

-- =============================================================================
-- After running: assign roles to users via SQL or Dashboard
-- Example (replace UUID with real user id):
--   update public.profiles set role = 'event_management' where id = 'user-uuid';
-- =============================================================================
