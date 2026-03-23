---
name: player-management-schema-and-rls
overview: Design database tables and RLS policies in Supabase to support student/player management, event registrations, participation history, and unique student ID validation for the /dashboard/player-management page.
todos:
  - id: define-students-table
    content: Define public.students registry table with unique Student ID and timestamps.
    status: completed
  - id: define-players-table
    content: Define public.players table linked to students and auth.users with constraints and indexes.
    status: completed
  - id: define-registrations-table
    content: Define public.player_event_registrations table linking players to events with uniqueness and history fields.
    status: completed
  - id: define-helper-function
    content: Create public.is_player_management() helper function for RLS policies.
    status: completed
  - id: define-rls-policies
    content: Write RLS policies for students, players, and player_event_registrations tables based on player_management role.
    status: completed
isProject: false
---

### Goals

- **Add core tables** to represent students/players, their sports profiles, and their event registrations.
- **Support features**: create player profile, event registration, view participation history, update details, and enforce unique/validated Student IDs.
- **Define subtle RLS policies** so that authenticated users with appropriate roles (e.g., `player_management`) can manage player data while keeping everything tenant-safe and auditable.
- **Deliverables**: one SQL file with table and index definitions, and a separate SQL file containing RLS policies and helper functions.

### Existing context

- **Current tables**: `[database/tables.sql](database/tables.sql)` already defines `public.profiles`, `public.events`, `public.venue_bookings`, and `public.venues`, using:
  - `auth.users` as the canonical user table (referenced via `id`/`created_by`).
  - Enum types like `public.user_role`, `public.event_status`, `public.venue_status`, `public.venue_booking_type`.
  - A shared `set_updated_at()` trigger function for `updated_at` maintenance.
- **Player-management role**: `public.profiles.role` defaults to `'player_management'::user_role`, which we can use in RLS policies.

### Proposed schema changes

- **1. Student registry table for Unique Student IDs**
  - Add `public.students` (or `public.student_registry`) to hold the master list of eligible students and enforce uniqueness for the Student ID.
  - Core columns:
    - `id uuid primary key default gen_random_uuid()`.
    - `student_id text not null unique` (the university-issued Unique Student ID).
    - `full_name text not null`.
    - `email text null`.
    - `faculty text null`, `batch text null`, `index_no text null` (optional but useful for SLIIT context).
    - `status` enum or text (e.g., `active`, `graduated`, `suspended`) if needed, or just `active boolean default true`.
    - `created_at`, `updated_at` with `set_updated_at()` trigger.
  - Indices:
    - Unique index on `student_id`.
    - Optional btree index on `full_name` or `email` for lookup.
- **2. Player profiles linked to student registry**
  - Add `public.players` table to represent sports-specific player profiles while referencing the student registry.
  - Core columns:
    - `id uuid primary key default gen_random_uuid()`.
    - `student_id uuid not null references public.students(id) on delete restrict` (FK to registry row, not plain text).
    - `sport text not null` (or enum later) for the primary sport.
    - `position text null`, `jersey_no integer null`, `team_name text null`.
    - `date_of_birth date null`, `gender text null`, `contact_no text null` if desired.
    - `created_by uuid not null references auth.users(id) on delete restrict` to track which admin created the profile.
    - `created_at`, `updated_at` with `set_updated_at()` trigger.
  - Constraints:
    - Unique constraint on `(student_id, sport)` so a student can only have one profile per sport.
  - Indices:
    - Btree index on `student_id`.
    - Btree index on `sport` to help filter players by sport.
- **3. Event registrations and participation history**
  - Add `public.player_event_registrations` (or `public.player_participations`) to link players to `public.events` and form the basis for participation history.
  - Core columns:
    - `id uuid primary key default gen_random_uuid()`.
    - `player_id uuid not null references public.players(id) on delete cascade`.
    - `event_id uuid not null references public.events(id) on delete restrict` (ties directly into your existing events table).
    - `registration_status text not null default 'registered'` (or enum later: `registered`, `confirmed`, `withdrawn`, `completed`).
    - `result text null` (e.g., time, score, position) or `performance jsonb` for flexibility.
    - `notes text null` for remarks.
    - `registered_at timestamp with time zone not null default now()`.
    - `created_by uuid not null references auth.users(id) on delete restrict`.
    - `created_at`, `updated_at` with `set_updated_at()` trigger.
  - Constraints:
    - Unique constraint on `(player_id, event_id)` to prevent duplicate registrations.
  - Indices:
    - Btree index on `(event_id, registration_status)` for event-centric queries.
    - Btree index on `player_id` for participation history per player.

### RLS and access control design

- **General approach**
  - Enable RLS on all three new tables: `students`, `players`, and `player_event_registrations`.
  - Use `auth.uid()` to map to the `public.profiles` row and check `profiles.role`.
  - Define **"subtle" policies** that:
    - Allow only authenticated users with `profile.role = 'player_management'` to insert, update, and delete rows.
    - Allow read-only access (select) to other authenticated users if needed (or restrict to the same role only; we’ll spell out both options in the SQL so you can choose).
- **Helper function**
  - Add a small `public.is_player_management()` SQL function that returns `boolean`, encapsulating the role lookup from `public.profiles`.
  - This keeps policy expressions concise and maintainable.
- **RLS policies per table**
  - `public.students`:
    - Policy to allow `select` where `public.is_player_management()` is true. Optionally, a more permissive `select` for all authenticated users if you want them to search students.
    - Policy to allow `insert`, `update`, `delete` only if `public.is_player_management()` is true.
  - `public.players`:
    - Similar role-based policies; only player-management users can create/update/delete player profiles.
    - Optional: `select` allowed for all authenticated users or only player-management.
  - `public.player_event_registrations`:
    - `select` allowed to authenticated users so they can view participation history (or restricted to player-management, depending on your preference).
    - `insert`, `update`, `delete` limited to player-management users.

### Files to produce for you

- **1. Schema SQL file (e.g., `database/player_management_tables.sql`)**
  - `create table public.students (...)` with constraints and indexes.
  - `create table public.players (...)` with constraints and indexes.
  - `create table public.player_event_registrations (...)` with constraints and indexes.
  - `create trigger ... set_updated_at()` for each table, consistent with `events` and `venues` in `[database/tables.sql](database/tables.sql)`.
- **2. RLS and helper SQL file (e.g., `database/player_management_rls.sql`)**
  - `create or replace function public.is_player_management() returns boolean ...` that checks `profiles.role` for `auth.uid()`.
  - `alter table ... enable row level security;` for each new table.
  - `create policy` statements implementing the role-based read/write access described above.

### How this supports your UI features

- **Create player profile**: Insert into `students` (if not already existing) and `players` with a unique `student_id`; backend or client can enforce one profile per student+sport.
- **Event registration**: Insert rows into `player_event_registrations` linking `players.id` to `events.id`, constrained by the uniqueness of `(player_id, event_id)`.
- **View participation history**: Query `player_event_registrations` joined to `players`, `students`, and `events` filtered by `player_id` or `student_id`.
- **Update details**: Update `students` and/or `players` rows as allowed by RLS policies.
- **Unique Student ID validation**: Enforced by the unique constraint on `students.student_id` and the FK from `players.student_id` to `students.id`.

If you confirm this plan, I will next provide concrete SQL for both files matching this structure, ready for you to paste into Supabase.