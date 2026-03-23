---
name: society-team-management-dashboard
overview: Implement team and member management on the /dashboard/society-management page, including team registration, captain assignment, member management, schedules tied to events/venues, and soft deletion of inactive teams.
todos:
  - id: db-schema-teams
    content: Extend database schema with societies, teams, team_members, and team_event_links tables for team management.
    status: completed
  - id: supabase-helpers
    content: Create Supabase data-access helpers for managing teams, members, captains, and team-event links.
    status: completed
  - id: server-actions
    content: Implement server actions or API routes for team registration, member management, captain assignment, schedules, and soft delete/restore.
    status: completed
  - id: society-ui-shell
    content: Refactor SocietyManagementDashboard into a shell component with tabs for Teams, Schedules, and optionally Members.
    status: completed
  - id: teams-ui
    content: "Implement Teams tab UI: list, register team form, team detail with member management and captain assignment, and soft delete/restore controls."
    status: completed
  - id: schedules-ui
    content: Implement Schedules tab UI to view and manage team-related events and venue bookings via team_event_links.
    status: completed
  - id: members-ui-optional
    content: Add optional Members tab focused on player-team assignments and unassigned players.
    status: completed
  - id: validation-polish
    content: Add validation, error handling, and UI polish, and ensure linter/tests pass for new and changed files.
    status: completed
isProject: false
---

## Goal

Implement a full society/team management experience on `SocietyManagementDashboard` so society management users can register and manage sports teams, assign captains, manage team members, manage team-related schedules (reusing existing `events` / `venue_bookings`), and soft-delete inactive teams.

## Data Model & Database Changes

- **Add `societies` table (if not already present)**
  - **Purpose**: Represent societies/clubs that own one or more teams.
  - **Schema sketch** (in `database/tables.sql`):
    - `id uuid pk default gen_random_uuid()`
    - `name text not null unique`
    - `description text null`
    - `created_by uuid not null references auth.users(id)`
    - `status text or enum` (e.g., `active` / `inactive`)
    - `created_at`, `updated_at` with existing `set_updated_at()` trigger pattern.
  - **Note**: If you already store societies elsewhere, we will instead reference that table and skip this new one.
- **Add `teams` table**
  - **Purpose**: Represent sports teams under societies.
  - **Fields**:
    - `id uuid pk default gen_random_uuid()`
    - `society_id uuid not null references societies(id) on delete restrict`
    - `name text not null` (unique per society: `(society_id, name)`)
    - `sport text not null` (can align with `players.sport`)
    - `status text or enum` (e.g., `active` / `inactive`), used for soft delete.
    - `created_by uuid not null references auth.users(id)`
    - `created_at`, `updated_at` with trigger.
- **Add `team_members` join table between `teams` and `players`**
  - **Purpose**: Map players to teams and track roles (captain/member, etc.).
  - **Fields**:
    - `id uuid pk default gen_random_uuid()`
    - `team_id uuid not null references teams(id) on delete cascade`
    - `player_id uuid not null references players(id) on delete restrict`
    - `role text` or enum (e.g., `captain`, `vice_captain`, `member`).
    - `joined_at timestamptz default now()`
    - `is_active boolean not null default true` (soft-removal from team membership).
    - Unique constraint `(team_id, player_id)`.
- **Model captain assignment**
  - **Option A (recommended)**: Represent captain via `team_members.role = 'captain'` and enforce at most one captain per team with a partial unique index:
    - Unique index on `(team_id)` where `role = 'captain'` and `is_active = true`.
  - **Option B**: Add `captain_member_id uuid references team_members(id)` on `teams` and keep `team_members.role` for display; we’ll start with Option A for simplicity.
- **Team schedules tied to existing `events` / `venue_bookings`**
  - **Add `team_event_links` table** (lightweight mapping):
    - `id uuid pk default gen_random_uuid()`
    - `team_id uuid not null references teams(id) on delete cascade`
    - `event_id uuid not null references events(id) on delete cascade`
    - Unique `(team_id, event_id)`.
  - **Usage**: When a manager defines a team schedule item, we create an `events` row (and associated `venue_bookings` if needed) and link via `team_event_links`.
- **Soft delete inactive teams**
  - Use `teams.status` (e.g., `active`/`inactive`) instead of physical deletion.
  - Optionally add `inactivated_at timestamptz` for audit.
  - UI and queries will filter to `status = 'active'` by default, with an option to view inactive.

## Backend / Supabase Access Layer

- **Create a dedicated Supabase data access module**
  - Add a file like `[lib/db/teams.ts](lib/db/teams.ts)` (or similar existing pattern) with typed helpers:
    - `getSocietiesForUser(userId)` (if society scoping is needed).
    - `getTeamsForSociety(societyId)` (active by default, optional flag for inactive).
    - `createTeam({ societyId, name, sport, createdBy })`.
    - `updateTeamStatus(teamId, status)`.
    - `addTeamMember({ teamId, playerId, role })` / `removeTeamMember(teamMemberId)`.
    - `setTeamCaptain({ teamId, playerId })` which handles demoting any existing captain.
    - `getTeamMembers(teamId)` joining `players` and `students` for display.
    - `linkTeamToEvent({ teamId, eventInput })` that creates an `events` row (and optional `venue_bookings`) and inserts into `team_event_links`.
    - `getTeamSchedule(teamId)` that fetches related `events` and any venue info.
  - Ensure all helpers are safe for server components and follow the existing `createClient` pattern.
- **Authorization & role checks**
  - Reuse the existing role gate in `SocietyManagementDashboard` (`profile.role === 'society_management'`).
  - In API routes or server actions, re-check that the authenticated user’s `role` allows modifying teams.

## UI / UX for `/dashboard/society-management`

We’ll transform `SocietyManagementDashboard` into a feature-rich, but clean, management UI using a few subcomponents.

- **High-level layout**
  - Keep the header (`Society Management` title and subtitle).
  - Below it, add a tabbed interface or segmented controls for:
    - `Teams`
    - `Members`
    - `Schedules`
    - (Optionally) `Inactive Teams`
  - Each tab will be its own component under something like `[app/dashboard/society-management/_components](app/dashboard/society-management/_components)`.
- **Teams tab**
  - **Team list**:
    - Table/grid listing teams for the current society: name, sport, captain, member count, status.
    - Actions per row: `View / Edit`, `Soft Delete` (mark inactive), possibly `View Schedule` shortcut.
  - **Register team form** (drawer or modal):
    - Inputs: `Team Name`, `Sport` (dropdown derived from existing `players.sport` values or a predefined list), `Society` (if user manages multiple), optional description.
    - On submit: call `createTeam`, update list optimistically.
  - **Soft delete inactive teams**:
    - `Soft Delete` action sets `teams.status = 'inactive'`.
    - Confirmation dialog, with optional reason note stored in a `notes` column if we add one.
    - Inactive teams are hidden from default list; `Inactive Teams` tab shows them with a `Restore` action.
- **Team details & member management**
  - When clicking `View / Edit` on a team:
    - Show a side panel or separate detail section with:
      - Team info (name, sport, status).
      - **Member management section**:
        - List of members (player name, student ID, position, role, active flag) from `team_members` joined with `players` and `students`.
        - Button `Add Member` opening a search/select dialog:
          - Search existing `players` (filtered by `sport` and maybe faculty or batch).
          - Select one or more players to add to `team_members`.
        - `Remove` member action sets `team_members.is_active = false` (or deletes record if we choose hard delete) and hides them from active view.
      - **Assign/Change captain**:
        - Within members list, toggle or button `Set as captain` per member.
        - Uses `setTeamCaptain` helper to ensure only one active captain per team.
- **Schedules tab (per team)**
  - The schedules tab can be driven by a selected team (dropdown or side selection):
    - Dropdown at top: `Select Team` → loads schedule for that team.
    - List upcoming events linked via `team_event_links` with `events` and optional `venue_bookings`:
      - Columns: `Event name`, `Date`, `Venue`, `Status` (from `events.status`).
  - **Add schedule item**:
    - Form for creating a new event for the selected team:
      - Inputs: `Name`, `Event Date`, `Sport Type` (pre-filled from team’s sport), `Venue` (select from `venues`), optional notes.
      - On submit:
        - Create `events` row.
        - Optionally create `venue_bookings` entry respecting the no-overlap constraints.
        - Insert `team_event_links` record.
    - Alternatively, allow linking to an existing event:
      - Search existing `events` (by sport/date) and select to link without creating a new one.
- **Members-centric view (optional)**
  - A `Members` tab that focuses on players:
    - Shows players and their current team assignments per sport.
    - Useful for quickly seeing which players are unassigned.
    - Backed by queries joining `team_members`, `players`, and `students`.

## Server Components, Actions, and Routing

- **Convert `SocietyManagementDashboard` into a shell + child components**
  - Keep the role-checking server component as-is for auth.
  - Move heavy data operations (mutations) into server actions or route handlers (depending on your existing pattern):
    - `registerTeamAction`
    - `updateTeamStatusAction`
    - `addTeamMemberAction` / `removeTeamMemberAction`
    - `setTeamCaptainAction`
    - `createTeamEventAndLinkAction`
  - Use these actions in client components (forms, buttons) under `_components`.
- **State management in the UI**
  - Use React state + `useTransition`/`useOptimistic` for responsive updates when adding/removing members or toggling captain.
  - Use `swr` or React Query only if already used in the project; otherwise stick to server components + actions for simplicity.

## Soft Deletion & Filtering Behavior

- **Teams**
  - All default queries filter `teams.status = 'active'`.
  - `Inactive Teams` tab includes filters and a `Restore` action to set `status = 'active'` again.
- **Team members**
  - Prefer `team_members.is_active` over hard delete to preserve historical records.
  - UI hides inactive members by default, with a toggle to show all if needed.

## Validation, UX, and Edge Cases

- **Validation rules**
  - Prevent registering two teams with the same name under a single society.
  - When assigning a captain:
    - Ensure the selected player is an active member of the team.
    - Ensure only one active captain per team via DB constraint or transaction.
  - When adding schedule events:
    - Reuse existing `venue_bookings` logic to prevent overlapping bookings.
- **Edge cases**
  - If a team is marked inactive, we should:
    - Prevent adding new members or schedule items.
    - Optionally hide the team from selection in the schedule and members views.
  - Handle missing societies or teams gracefully with empty-state UIs and onboarding text.

## Implementation Order (High-Level Todos)

1. **Database layer**: Add `societies`, `teams`, `team_members`, and `team_event_links` tables and indexes in `database/tables.sql`, run migrations, and verify with Supabase.
2. **Supabase helpers**: Implement typed data-access helpers for teams, members, and team-event links (new module under `lib/db/` or similar).
3. **Server actions / API routes**: Implement actions for team CRUD, member management, captain assignment, and schedule creation/linking.
4. **Society management UI shell**: Refactor `SocietyManagementDashboard` into a shell component with tabs and load initial data needed for lists.
5. **Teams UI**: Build the `Teams` tab: list, register form, soft delete/restore, and team detail panel with member management and captain assignment.
6. **Schedules UI**: Build the `Schedules` tab with per-team schedule view, add/link schedule items to `events`/`venue_bookings`, and integrate with `team_event_links`.
7. **Members view (optional)**: Add a members-centric tab if desired for quick overview of player-team assignments.
8. **Polish & validation**: Add input validation, loading/empty states, error handling, and check for linter issues with the updated files.

