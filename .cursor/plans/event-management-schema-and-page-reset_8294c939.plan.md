---
name: event-management-schema-and-page-reset
overview: Redesign the /dashboard/event-management workspace and introduce new Supabase tables plus RLS policies for managing internal sports events.
todos:
  - id: design-events-schema
    content: Design minimal events table structure and constraints for internal sports events (name, date, venue, sport_type, status, created_by).
    status: completed
  - id: design-events-rls
    content: Define RLS policies for events so only event_management role can create/update/cancel while all authenticated users can read.
    status: completed
  - id: prepare-sql-file-plan
    content: Plan the contents and structure of a new SQL file (e.g. database/events.sql) containing schema and RLS to run in Supabase.
    status: completed
  - id: reset-event-page-layout
    content: Plan changes to event-management Next.js page to clear current content and provide an empty workspace layout without data wiring yet.
    status: completed
isProject: false
---

## Goals

- **Reset the `event-management` page** to an empty but structured workspace ready for feature development.
- **Design SQL schemas + RLS policies** for event management that match your existing `profiles`/`user_role` setup.
- **Scope**: Internal sports events only, with minimal but solid fields: name, date, venue, sport type, status, created_by.

## High-Level Design

- **Events data model**
  - `events` table for core event records: name, date, venue, sport_type, status, created_by, timestamps.
  - Optional lookup tables (if desired later): `venues`, `sports`. For now we can keep venues/sport types as text with simple validations to stay minimal.
  - Enforce **no duplicate events** on `(event_date, venue, sport_type)` to avoid scheduling conflicts.
  - Use a small status enum for simplicity: `planned`, `active`, `completed`, `cancelled`.
- **Access control / RLS** (aligned with your existing `profiles` table in `[database/tables.sql](database/tables.sql)` and migration `[supabase/migrations/001_profiles_roles_rls.sql](supabase/migrations/001_profiles_roles_rls.sql)`):
  - Only users whose `profiles.role = 'event_management'` can **insert, update, or cancel** events.
  - All authenticated users can **select**/view upcoming events (unless you tell me otherwise later).
  - RLS uses `auth.uid()` joined to `profiles` (similar style to your existing policies) to keep policies subtle but explicit.
- **Next.js page layout**
  - Keep `app/dashboard/event-management/page.tsx` role-check logic as-is, but
    - Replace current static heading-only content with an **empty workspace layout**: header, filters toolbar (initially non-functional), and a placeholder table area.
    - This creates a clean surface where we can later wire up create/update/cancel lists against the new `events` table.

## Detailed Steps

### 1. Define SQL schema & RLS in a new file

- **Create a new SQL file** (for you to run manually in Supabase), e.g. `[database/events.sql](database/events.sql)` containing:
  - **Enum type** `public.event_status` with values: `planned`, `active`, `completed`, `cancelled`.
  - `**public.events` table** with columns like:
    - `id uuid primary key default gen_random_uuid()`
    - `name text not null`
    - `event_date date not null`
    - `venue text not null`
    - `sport_type text not null`
    - `status public.event_status not null default 'planned'`
    - `created_by uuid not null references auth.users(id)`
    - `created_at timestamptz not null default now()`
    - `updated_at timestamptz not null default now()`
  - **Indexes & constraints**:
    - Unique constraint on `(event_date, venue, sport_type)` for duplicate/schedule validation.
    - Btree indexes on `event_date` (for upcoming events), and `status` if needed.
  - **RLS policies** (subtle and role-aware):
    - Enable RLS on `public.events`.
    - `SELECT` policy allowing all authenticated users to see events (or we can tighten to event managers only later if you prefer):
      - `using ( auth.role() = 'authenticated' )` or via join on `profiles` if we want profile-based filtering later.
    - `INSERT`, `UPDATE`, `DELETE` policies restricted to users whose `profiles.role = 'event_management'`:
      - Use a `exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'event_management')` check.
      - For `INSERT`/`UPDATE`, ensure `with check` enforces same condition and that `created_by` = `auth.uid()` on insert.
    - Optional `updated_at` trigger reusing `public.set_updated_at()` if you want consistent timestamp handling.

### 2. Reset the Event Management page to an empty workspace

- In `[app/dashboard/event-management/page.tsx](app/dashboard/event-management/page.tsx)`:
  - **Keep** the existing Supabase client, user fetch, and redirect logic that ensures only `event_management` role can access this page.
  - Replace the inner JSX with a more structured, but still empty, workspace layout, for example:
    - Header section with title and subtitle (`Event Management`, "Manage sports events, schedules, and registrations").
    - Toolbar section with placeholders for future features (e.g. disabled `New Event` button, filters for date and sport type, search input) but no real data wiring yet.
    - Main content area showing a blank state ("No events yet" message) and a short hint that events will appear here once created.
  - Ensure styling is consistent with your dashboard layout (likely using your shared UI components if available) but avoid implementing any data-fetching or forms yet.

### 3. Prepare for future feature implementation (not executed yet)

Once the schema is in place and the page is reset, we will be ready to implement the concrete features you described:

- **Create & update events**
  - Next steps later: a server action or API route to insert/update rows in `public.events` with validation (date not in past if you want, non-empty name, etc.).
- **Assign date, venue, sport type**
  - Forms/components that write into `event_date`, `venue`, and `sport_type` columns.
- **View upcoming events & cancel events**
  - Queries filtered on `event_date >= current_date` and `status != 'cancelled'` for the list.
  - Update action that sets `status = 'cancelled'` instead of deleting.
- **Date & duplicate validation**
  - Database-level: unique constraint on `(event_date, venue, sport_type)` plus optional `check` constraints.
  - App-level: pre-checks that surface friendly error messages from Postgres constraint violations.

## What You Will Get Next

- A **ready-to-run SQL file** (e.g. `database/events.sql`) with:
  - `event_status` enum definition.
  - `events` table definition.
  - Indexes and unique constraint for duplicate prevention.
  - RLS policies tailored to your existing `profiles` and `user_role` setup.
- An **updated `event-management` page layout** that is visually clean and empty, ready for the feature implementations you will provide next.

