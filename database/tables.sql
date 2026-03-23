create table public.events (
  id uuid not null default gen_random_uuid (),
  name text not null,
  event_date date not null,
  venue text not null,
  sport_type text not null,
  status public.event_status not null default 'planned'::event_status,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint events_pkey primary key (id),
  constraint events_unique_schedule unique (event_date, venue, sport_type),
  constraint events_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete RESTRICT
) TABLESPACE pg_default;

create index IF not exists events_event_date_idx on public.events using btree (event_date) TABLESPACE pg_default;

create index IF not exists events_status_idx on public.events using btree (status) TABLESPACE pg_default;

create trigger events_updated_at BEFORE
update on events for EACH row
execute FUNCTION set_updated_at ();

create table public.player_event_registrations (
  id uuid not null default gen_random_uuid (),
  player_id uuid not null,
  event_id uuid not null,
  registration_status text not null default 'registered'::text,
  result text null,
  performance jsonb null,
  notes text null,
  registered_at timestamp with time zone not null default now(),
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint player_event_registrations_pkey primary key (id),
  constraint player_event_unique unique (player_id, event_id),
  constraint player_event_registrations_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete RESTRICT,
  constraint player_event_registrations_event_id_fkey foreign KEY (event_id) references events (id) on delete RESTRICT,
  constraint player_event_registrations_player_id_fkey foreign KEY (player_id) references players (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists player_event_registrations_player_idx on public.player_event_registrations using btree (player_id) TABLESPACE pg_default;

create index IF not exists player_event_registrations_event_status_idx on public.player_event_registrations using btree (event_id, registration_status) TABLESPACE pg_default;

create trigger player_event_registrations_updated_at BEFORE
update on player_event_registrations for EACH row
execute FUNCTION set_updated_at ();

create table public.players (
  id uuid not null default gen_random_uuid (),
  student_id uuid not null,
  sport text not null,
  position text null,
  jersey_no integer null,
  team_name text null,
  date_of_birth date null,
  gender text null,
  contact_no text null,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint players_pkey primary key (id),
  constraint players_student_sport_unique unique (student_id, sport),
  constraint players_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete RESTRICT,
  constraint players_student_id_fkey foreign KEY (student_id) references students (id) on delete RESTRICT
) TABLESPACE pg_default;

create index IF not exists players_student_id_idx on public.players using btree (student_id) TABLESPACE pg_default;

create index IF not exists players_sport_idx on public.players using btree (sport) TABLESPACE pg_default;

create trigger players_updated_at BEFORE
update on players for EACH row
execute FUNCTION set_updated_at ();

create table public.profiles (
  id uuid not null,
  role public.user_role not null default 'player_management'::user_role,
  full_name text null,
  email text null,
  avatar_url text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists profiles_role_idx on public.profiles using btree (role) TABLESPACE pg_default;

create trigger profiles_updated_at BEFORE
update on profiles for EACH row
execute FUNCTION set_updated_at ();

create table public.societies (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  status text not null default 'active'::text,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint societies_pkey primary key (id),
  constraint societies_name_key unique (name),
  constraint societies_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete RESTRICT
) TABLESPACE pg_default;

create index IF not exists societies_status_idx on public.societies using btree (status) TABLESPACE pg_default;

create trigger societies_updated_at BEFORE
update on societies for EACH row
execute FUNCTION set_updated_at ();

create table public.students (
  id uuid not null default gen_random_uuid (),
  student_id text not null,
  full_name text not null,
  email text null,
  faculty text null,
  batch text null,
  index_no text null,
  active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint students_pkey primary key (id),
  constraint students_student_id_key unique (student_id)
) TABLESPACE pg_default;

create index IF not exists students_full_name_idx on public.students using btree (full_name) TABLESPACE pg_default;

create index IF not exists students_email_idx on public.students using btree (email) TABLESPACE pg_default;

create trigger students_updated_at BEFORE
update on students for EACH row
execute FUNCTION set_updated_at ();

create table public.team_event_links (
  id uuid not null default gen_random_uuid (),
  team_id uuid not null,
  event_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint team_event_links_pkey primary key (id),
  constraint team_event_links_team_event_unique unique (team_id, event_id),
  constraint team_event_links_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint team_event_links_team_id_fkey foreign KEY (team_id) references teams (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists team_event_links_team_idx on public.team_event_links using btree (team_id) TABLESPACE pg_default;

create index IF not exists team_event_links_event_idx on public.team_event_links using btree (event_id) TABLESPACE pg_default;

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
  constraint team_members_player_id_fkey foreign KEY (player_id) references players (id) on delete RESTRICT,
  constraint team_members_team_id_fkey foreign KEY (team_id) references teams (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists team_members_team_idx on public.team_members using btree (team_id) TABLESPACE pg_default;

create index IF not exists team_members_player_idx on public.team_members using btree (player_id) TABLESPACE pg_default;

create index IF not exists team_members_captain_unique_idx on public.team_members using btree (team_id) TABLESPACE pg_default
where
  (
    (role = 'captain'::text)
    and (is_active = true)
  );

create trigger team_members_updated_at BEFORE
update on team_members for EACH row
execute FUNCTION set_updated_at ();

create table public.teams (
  id uuid not null default gen_random_uuid (),
  society_id uuid not null,
  name text not null,
  sport text not null,
  status text not null default 'active'::text,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint teams_pkey primary key (id),
  constraint teams_society_name_unique unique (society_id, name),
  constraint teams_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete RESTRICT,
  constraint teams_society_id_fkey foreign KEY (society_id) references societies (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists teams_society_idx on public.teams using btree (society_id) TABLESPACE pg_default;

create index IF not exists teams_status_idx on public.teams using btree (status) TABLESPACE pg_default;

create trigger teams_updated_at BEFORE
update on teams for EACH row
execute FUNCTION set_updated_at ();

create table public.venue_bookings (
  id uuid not null default gen_random_uuid (),
  venue_id uuid not null,
  event_id uuid null,
  booking_type public.venue_booking_type not null,
  booking_start timestamp with time zone not null,
  booking_end timestamp with time zone not null,
  notes text null,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  booking_range tstzrange GENERATED ALWAYS as (
    tstzrange (booking_start, booking_end, '[)'::text)
  ) STORED null,
  constraint venue_bookings_pkey primary key (id),
  constraint venue_bookings_venue_id_fkey foreign KEY (venue_id) references venues (id) on delete RESTRICT,
  constraint venue_bookings_event_id_fkey foreign KEY (event_id) references events (id) on delete set null,
  constraint venue_bookings_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete RESTRICT,
  constraint venue_bookings_event_check check (
    (
      (booking_type <> 'event'::venue_booking_type)
      or (event_id is not null)
    )
  ),
  constraint venue_bookings_time_check check ((booking_end > booking_start)),
  constraint venue_bookings_no_overlap EXCLUDE using gist (
    venue_id
    with
      =,
      booking_range
    with
      &&
  )
) TABLESPACE pg_default;

create index IF not exists venue_bookings_venue_start_idx on public.venue_bookings using btree (venue_id, booking_start) TABLESPACE pg_default;

create trigger venue_bookings_updated_at BEFORE
update on venue_bookings for EACH row
execute FUNCTION set_updated_at ();

create table public.venues (
  id uuid not null default gen_random_uuid (),
  name text not null,
  location text null,
  capacity integer null,
  surface_type text null,
  status public.venue_status not null default 'active'::venue_status,
  open_time time without time zone not null default '08:00:00'::time without time zone,
  close_time time without time zone not null default '22:00:00'::time without time zone,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint venues_pkey primary key (id),
  constraint venues_name_key unique (name),
  constraint venues_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete RESTRICT
) TABLESPACE pg_default;

create index IF not exists venues_status_idx on public.venues using btree (status) TABLESPACE pg_default;

create index IF not exists venues_name_idx on public.venues using btree (name) TABLESPACE pg_default;

create trigger venues_updated_at BEFORE
update on venues for EACH row
execute FUNCTION set_updated_at ();

