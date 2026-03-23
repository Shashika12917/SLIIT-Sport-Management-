---
name: results-and-performance-management
overview: Add a results and performance management layer on top of existing events/teams/players, including match result recording, leaderboards, and performance reports, wired into the `/dashboard/results-management` page and backed by new Supabase tables and RLS.
todos:
  - id: design-schema
    content: Design matches, match_teams, and match_player_stats tables plus indexes and relationships based on existing events/teams/players schema.
    status: completed
  - id: define-rls
    content: Define and document RLS policies and roles for managing and viewing results and performance data.
    status: completed
  - id: api-layer
    content: Plan Supabase data-access helpers for matches CRUD, leaderboard aggregation, and player stats.
    status: completed
  - id: ui-shell
    content: Plan `/dashboard/results-management` page layout with tabs for Match Results, Leaderboards, and Performance Reports.
    status: completed
  - id: result-entry-flow
    content: Plan UX flow and logic for recording and updating match results with auto winner calculation and optional player stats entry.
    status: completed
  - id: leaderboards-reports
    content: Plan structure of team and player leaderboards and performance reports, including essential filters and metrics.
    status: completed
isProject: false
---

### Goals

- **Record match results** tied to existing `events`, `teams`, and `players`.
- **Auto-calculate winner** from entered scores.
- **Allow authorized updates** to previously stored match results.
- **Generate leaderboards** (team and player views) and **basic performance reports**.
- **Keep schema generic** so it works for any sport, using final scores rather than sport-specific scoring models.

### Data model & SQL layer

- **Introduce match-level table**
  - New table in a fresh SQL file (e.g. `[database/results_management.sql](database/results_management.sql)`) to keep changes isolated from `tables.sql`.
  - Table: `public.matches`
    - Links to `events` (`event_id`) so every match is part of an event schedule.
    - Optional `venue_id` (or derive via event), `match_date`, `status` (scheduled, completed, cancelled).
    - Generic fields: `match_type` (league, knockout, friendly), `notes`, audit fields (`created_by`, timestamps).
    - Optional `winner_team_id` (nullable until result is entered) to support quick queries.
- **Introduce match participant table (teams)**
  - Table: `public.match_teams`
    - `match_id`, `team_id` referencing `matches` and `teams`.
    - `score` as integer (generic points/goals/runs) and optional `extra_info` JSONB for sport-specific notes when needed later (e.g. sets, overs).
    - Derived flags: `is_winner` (bool) that can be auto-set by the backend logic when scores are saved.
    - Unique constraint per (`match_id`, `team_id`).
- **Introduce optional player performance table**
  - Table: `public.match_player_stats`
    - `match_id`, `player_id`, `team_id` (for joins to team and players), references `matches`, `players`, `teams`.
    - Generic fields: `minutes_played` (or similar), `points_scored` (integer), `rating` (numeric), and a `metrics` JSONB for sport-specific details (goals, assists, wickets, etc.).
    - Unique constraint per (`match_id`, `player_id`).
  - This supports individual performance reports and player leaderboards without locking into a rigid stat schema.
- **RLS & roles for results management**
  - Enable RLS on all new tables: `matches`, `match_teams`, `match_player_stats`.
  - Leverage existing `profiles.role` enum (`public.user_role`) and current patterns in `[database/society_teams.sql](database/society_teams.sql)` and `[database/tables.sql](database/tables.sql)`:
    - Define a role (likely reusing `society_management` and/or a dedicated `results_management` role if already defined) as **authorized results manager**.
  - Policies (examples):
    - **Select**: society management (and possibly player management) can read all matches and stats; players may see matches they participated in via joins (`team_members`, `player_event_registrations`).
    - **Insert/Update/Delete** on `matches` and `match_teams` restricted to users with management roles (`profiles.role in ('society_management','player_management')` or a new `results_management`).
    - **Insert/Update** on `match_player_stats` similarly limited to management roles.
  - Keep policies consistent with patterns like `team_event_links_write_for_society_management` for easier maintenance.
- **Derived views or convenience functions (optional)**
  - Create SQL views to simplify leaderboard and reporting queries:
    - `view_team_leaderboard`: aggregates per `team_id` within sport:
      - Columns: `team_id`, `sport`, `played`, `wins`, `draws`, `losses`, `goals_for`, `goals_against`, `goal_diff`, `points` (simple rule, e.g. win=3, draw=1, loss=0).
    - `view_player_leaderboard`: aggregates per `player_id` within sport:
      - Columns: `player_id`, `sport`, `matches_played`, `points_scored`, `avg_rating`, etc.
  - Alternatively, plan to compute these in the application layer first, and introduce views later if needed; keep the plan open to either approach based on performance.

### Application API & Supabase client layer

- **Match results CRUD**
  - Add a small data access module on the frontend (or shared utilities) for the `/dashboard/results-management` page, e.g. `lib/results.ts`:
    - **List matches** with filters: by sport, date range, event, match status.
    - **Create match**: insert into `matches` plus `match_teams` rows.
    - **Update match scores**: update `match_teams.score`, auto-calculate `is_winner` and `winner_team_id` based on highest score (tie support: mark no winner or both sides as draw per rule).
    - **Update player stats**: upsert into `match_player_stats` for the selected match.
  - Encapsulate winner-calculation logic in a helper function:
    - Given a list of teams with scores, determine winner or detect tie.
    - For now, assume simple “higher score wins; equal scores == draw; no winner stored” unless later configured per sport.
- **Leaderboard & performance queries**
  - Implement helper functions for leaderboard data:
    - Fetch team standings per sport (or per event/competition if needed) using either SQL views or aggregated queries against `matches` + `match_teams`.
    - Fetch player performance summaries per sport using aggregates over `match_player_stats`.
  - Return data in a UI-friendly shape (e.g. sorted arrays with rank numbers precomputed) to keep React components focused on rendering.

### `/dashboard/results-management` UI/UX

- **Overall layout**
  - Use a tabbed or segmented layout with sections such as:
    - **Match Results**: record and edit results.
    - **Leaderboards**: team and player leaderboards.
    - **Performance Reports**: filters and summary panels.
  - Ensure layout/visual style matches existing dashboard pages (reusing components like cards, tables, filters from other dashboard sections).
- **Match Results tab**
  - **Filter bar** at the top:
    - Sport selector (based on `events.sport_type` or `teams.sport`).
    - Date range picker.
    - Event dropdown (optional, derived from `events`).
  - **Match list table**:
    - Columns: Event/Competition, Date/Time, Teams (e.g. `Team A vs Team B`), Scores, Status, Winner, Actions.
    - Paginated or scrollable.
  - **Result entry/edit drawer/modal**:
    - When clicking “Add Result” or an existing row, open a side panel/modal.
    - Inputs:
      - Teams in the match (pre-populated from `team_event_links` if available).
      - Score input per team (integer fields).
      - Optional notes and match type.
      - Optional player stats section (accordion) to enter player-level numbers for that match.
    - Upon save:
      - Call the data access layer to upsert `matches`, `match_teams`, and optionally `match_player_stats`.
      - Auto-compute and persist winner fields.
    - Disable editing if user doesn’t have the management role, but allow viewing.
- **Leaderboards tab**
  - **Toggle between Team and Player leaderboards**.
  - **Common filters**:
    - Sport.
    - Time window (this season, last 30 days, custom date range).
    - Optionally, event/competition.
  - **Team leaderboard view**:
    - Table with columns: Rank, Team, Played, Wins, Draws, Losses, Goals For, Goals Against, Goal Diff, Points.
    - Data from helper function aggregating match results.
  - **Player leaderboard view**:
    - Table with columns: Rank, Player, Team, Matches, Points/Goals, Avg Rating, etc.
    - Data from helper function aggregating `match_player_stats`.
- **Performance Reports tab**
  - Focus on simple, high-value reports first:
    - **Team performance over time**: trend of wins/losses or points across date ranges (list + simple chart if charting lib is already used in the project).
    - **Player performance summaries**: breakdown for a selected player or team.
  - UI elements:
    - Filters: sport, team, player, date range.
    - Summary cards: total matches, win rate, total points, top scorers.

### Authorization & UX guards

- **Role-based access in UI**
  - Read user profile role (from `profiles.role` which you already have) and:
    - **Management roles**: full CRUD on match results and stats, can access all tabs.
    - **Non-management users (e.g. players)**: read-only access to leaderboards and reports; hide or disable editing controls on Match Results.
  - Surface clear messages/tooltips when actions are disabled due to lack of permissions.
- **Data validation & edge cases**
  - Ensure at least two teams are attached to a match before results can be saved.
  - Prevent negative scores; treat empty scores as “not yet played”.
  - Handle ties gracefully (no `winner_team_id`, both teams counted as draw in standings).
  - Guard against editing completed matches if you want a “locked” state (e.g. only certain roles can reopen).

### Implementation steps

- **1. Schema design & SQL file**
  - Draft `matches`, `match_teams`, `match_player_stats` tables with indexes and FK constraints in a new SQL file.
  - Add RLS enablement and core policies for management roles.
  - (Optional) Add SQL views for team and player leaderboards.
- **2. Supabase typings & client integration**
  - Regenerate Supabase types (if you’re using them) so the new tables are available in the TypeScript client.
  - Create a `results` data-access module with typed functions for match CRUD and leaderboard aggregation.
- **3. `/dashboard/results-management` page structure**
  - Implement the tabbed layout and basic shell of the page.
  - Wire up initial queries to list matches and show a basic leaderboard using mock or minimal data.
- **4. Match result entry and editing**
  - Build the result entry modal/drawer and connect it to the Supabase mutations.
  - Implement winner auto-calculation and refresh the list on save.
- **5. Leaderboards & performance reports**
  - Implement aggregation helpers or view-based queries for team and player leaderboards.
  - Add filters and simple UI to display them.
  - Add initial performance report views (summary cards + optional charts if available).
- **6. Polish, validation, and authorization checks**
  - Add form validation for scores and required fields.
  - Ensure UI respects role-based permissions.
  - Iterate on UX details (loading states, empty states, error messages).

