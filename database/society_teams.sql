create table public.societies (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  status text not null default 'active',
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint societies_pkey primary key (id),
  constraint societies_name_key unique (name),
  constraint societies_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete RESTRICT
);

create index IF not exists societies_status_idx on public.societies using btree (status);

create trigger societies_updated_at BEFORE
update on societies for EACH row
execute FUNCTION set_updated_at ();

create table public.teams (
  id uuid not null default gen_random_uuid (),
  society_id uuid not null,
  name text not null,
  sport text not null,
  status text not null default 'active',
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint teams_pkey primary key (id),
  constraint teams_society_name_unique unique (society_id, name),
  constraint teams_society_id_fkey foreign KEY (society_id) references societies (id) on delete CASCADE,
  constraint teams_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete RESTRICT
);

create index IF not exists teams_society_idx on public.teams using btree (society_id);

create index IF not exists teams_status_idx on public.teams using btree (status);

create trigger teams_updated_at BEFORE
update on teams for EACH row
execute FUNCTION set_updated_at ();

create table public.team_members (
  id uuid not null default gen_random_uuid (),
  team_id uuid not null,
  player_id uuid not null,
  role text null,
  joined_at timestamp with time zone not null default now(),
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint team_members_pkey primary key (id),
  constraint team_members_team_player_unique unique (team_id, player_id),
  constraint team_members_team_id_fkey foreign KEY (team_id) references teams (id) on delete CASCADE,
  constraint team_members_player_id_fkey foreign KEY (player_id) references players (id) on delete RESTRICT
);

create index IF not exists team_members_team_idx on public.team_members using btree (team_id);

create index IF not exists team_members_player_idx on public.team_members using btree (player_id);

create index IF not exists team_members_captain_unique_idx on public.team_members using btree (team_id) where ((role = 'captain') and (is_active = true));

create trigger team_members_updated_at BEFORE
update on team_members for EACH row
execute FUNCTION set_updated_at ();

create table public.team_event_links (
  id uuid not null default gen_random_uuid (),
  team_id uuid not null,
  event_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint team_event_links_pkey primary key (id),
  constraint team_event_links_team_event_unique unique (team_id, event_id),
  constraint team_event_links_team_id_fkey foreign KEY (team_id) references teams (id) on delete CASCADE,
  constraint team_event_links_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE
);

create index IF not exists team_event_links_team_idx on public.team_event_links using btree (team_id);

create index IF not exists team_event_links_event_idx on public.team_event_links using btree (event_id);

-- Row Level Security

alter table public.societies enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_event_links enable row level security;

-- Allow society management users to view all societies
create policy societies_select_for_society_management on public.societies
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'society_management'
  )
);

-- Only the creator (society manager) can insert/update/delete their societies
create policy societies_write_own on public.societies
for all
using (created_by = auth.uid())
with check (created_by = auth.uid());

-- Teams: society management users can read all teams
create policy teams_select_for_society_management on public.teams
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'society_management'
  )
);

-- Only creator can change their teams
create policy teams_write_own on public.teams
for all
using (created_by = auth.uid())
with check (created_by = auth.uid());

-- Team members: society management users can see all memberships
create policy team_members_select_for_society_management on public.team_members
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'society_management'
  )
);

-- Society management users can manage memberships
create policy team_members_write_for_society_management on public.team_members
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'society_management'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'society_management'
  )
);

-- Team event links: society management users can see and manage schedule links
create policy team_event_links_select_for_society_management on public.team_event_links
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'society_management'
  )
);

create policy team_event_links_write_for_society_management on public.team_event_links
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'society_management'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'society_management'
  )
);


