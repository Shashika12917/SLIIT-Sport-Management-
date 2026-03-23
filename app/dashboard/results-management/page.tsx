import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getPlayerLeaderboard,
  getTeamLeaderboard,
  listMatchesWithTeams,
} from "@/lib/results";
import { recordMatchResult } from "./actions";

export default async function ResultsManagementDashboard({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "results_management") {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams?.tab ?? "results";

  const [matches, teamLeaderboard, playerLeaderboard] = await Promise.all([
    listMatchesWithTeams(),
    getTeamLeaderboard({}),
    getPlayerLeaderboard({}),
  ]);

  return (
    <div className="space-y-6">
      <header className="border-b border-base-200 pb-4">
        <h1 className="text-2xl font-bold mb-1">Results Management</h1>
        <p className="text-sm text-base-content/70">
          Record match results, update scores, and review performance
          leaderboards.
        </p>
      </header>

      <div role="tablist" className="tabs tabs-bordered">
        <Link
          role="tab"
          href="/dashboard/results-management?tab=results"
          className={`tab ${activeTab === "results" ? "tab-active" : ""}`}
        >
          Match Results
        </Link>
        <Link
          role="tab"
          href="/dashboard/results-management?tab=leaderboards"
          className={`tab ${activeTab === "leaderboards" ? "tab-active" : ""}`}
        >
          Leaderboards
        </Link>
        <Link
          role="tab"
          href="/dashboard/results-management?tab=reports"
          className={`tab ${activeTab === "reports" ? "tab-active" : ""}`}
        >
          Performance Reports
        </Link>
      </div>

      {activeTab === "results" && (
        <section aria-label="Match results" className="space-y-4">
          <div className="card bg-base-100 border border-base-300/70">
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral">
                    Record match result
                  </h2>
                  <p className="text-xs text-base-content/70">
                    Enter scores for two teams in an event. The winner will be
                    auto-calculated.
                  </p>
                </div>
              </div>

              <form action={recordMatchResult} className="grid gap-3 md:grid-cols-4">
                <div className="form-control">
                  <label htmlFor="event_id" className="label py-1">
                    <span className="label-text text-xs font-medium">
                      Event ID
                    </span>
                  </label>
                  <input
                    id="event_id"
                    name="event_id"
                    required
                    type="text"
                    placeholder="Paste event UUID"
                    className="input input-sm input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label htmlFor="match_date" className="label py-1">
                    <span className="label-text text-xs font-medium">
                      Match date
                    </span>
                  </label>
                  <input
                    id="match_date"
                    name="match_date"
                    type="datetime-local"
                    className="input input-sm input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label htmlFor="match_type" className="label py-1">
                    <span className="label-text text-xs font-medium">
                      Match type
                    </span>
                  </label>
                  <input
                    id="match_type"
                    name="match_type"
                    type="text"
                    placeholder="League / Knockout"
                    className="input input-sm input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label htmlFor="notes" className="label py-1">
                    <span className="label-text text-xs font-medium">
                      Notes
                    </span>
                  </label>
                  <input
                    id="notes"
                    name="notes"
                    type="text"
                    placeholder="Optional notes"
                    className="input input-sm input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label htmlFor="team1_id" className="label py-1">
                    <span className="label-text text-xs font-medium">
                      Team 1 ID
                    </span>
                  </label>
                  <input
                    id="team1_id"
                    name="team1_id"
                    required
                    type="text"
                    placeholder="Team UUID"
                    className="input input-sm input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label htmlFor="team1_score" className="label py-1">
                    <span className="label-text text-xs font-medium">
                      Team 1 score
                    </span>
                  </label>
                  <input
                    id="team1_score"
                    name="team1_score"
                    type="number"
                    min={0}
                    className="input input-sm input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label htmlFor="team2_id" className="label py-1">
                    <span className="label-text text-xs font-medium">
                      Team 2 ID
                    </span>
                  </label>
                  <input
                    id="team2_id"
                    name="team2_id"
                    required
                    type="text"
                    placeholder="Team UUID"
                    className="input input-sm input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label htmlFor="team2_score" className="label py-1">
                    <span className="label-text text-xs font-medium">
                      Team 2 score
                    </span>
                  </label>
                  <input
                    id="team2_score"
                    name="team2_score"
                    type="number"
                    min={0}
                    className="input input-sm input-bordered w-full"
                  />
                </div>

                <div className="md:col-span-4 flex justify-end pt-1">
                  <button type="submit" className="btn btn-primary btn-sm">
                    Save result
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1 gap-2">
              <div>
                <h2 className="text-lg font-semibold">Recent matches</h2>
                <p className="text-xs text-base-content/60">
                  Saved match results appear here and feed the leaderboards.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-box border border-base-300/70">
              <table className="table table-sm">
                <thead>
                  <tr className="bg-base-200/60">
                    <th>Event</th>
                    <th>Date</th>
                    <th>Teams</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-sm py-6">
                        No matches recorded yet. Results will appear here once
                        you start saving match scores.
                      </td>
                    </tr>
                  ) : (
                    matches.map((match) => {
                      const teams = match.teams ?? [];
                      const vsLabel =
                        teams.length > 0
                          ? teams
                              .map((t) => t.team?.name ?? "Unknown team")
                              .join(" vs ")
                          : "TBD";
                      const scoreLabel =
                        teams.length > 0
                          ? teams
                              .map(
                                (t) =>
                                  `${t.team?.name ?? "Team"} ${
                                    typeof t.score === "number" ? t.score : "-"
                                  }`
                              )
                              .join(" / ")
                          : "-";
                      const winnerName =
                        teams.find((t) => t.is_winner)?.team?.name ?? "—";

                      return (
                        <tr key={match.id}>
                          <td className="text-xs">
                            <div className="font-medium">
                              {match.event?.name ?? "Unnamed event"}
                            </div>
                            <div className="text-[11px] text-base-content/60">
                              {match.event?.sport_type}
                            </div>
                          </td>
                          <td className="text-xs whitespace-nowrap">
                            {new Date(match.match_date).toLocaleString()}
                          </td>
                          <td className="text-xs">{vsLabel}</td>
                          <td className="text-xs capitalize">
                            {match.status}
                          </td>
                          <td className="text-xs">{scoreLabel}</td>
                          <td className="text-xs">{winnerName}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {activeTab === "leaderboards" && (
        <section aria-label="Leaderboards">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold mb-2">Team leaderboard</h2>
              <div className="overflow-x-auto rounded-box border border-base-300/70">
                <table className="table table-xs">
                  <thead>
                    <tr className="bg-base-200/60 text-[11px]">
                      <th>#</th>
                      <th>Team</th>
                      <th>Sport</th>
                      <th>P</th>
                      <th>W</th>
                      <th>D</th>
                      <th>L</th>
                      <th>GF</th>
                      <th>GA</th>
                      <th>GD</th>
                      <th>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamLeaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center text-xs py-4">
                          Leaderboard will populate once matches are completed.
                        </td>
                      </tr>
                    ) : (
                      teamLeaderboard.map((row, index) => (
                        <tr key={row.teamId}>
                          <td className="text-[11px]">{index + 1}</td>
                          <td className="text-[11px]">{row.teamName}</td>
                          <td className="text-[11px]">{row.sport}</td>
                          <td className="text-[11px]">{row.played}</td>
                          <td className="text-[11px]">{row.wins}</td>
                          <td className="text-[11px]">{row.draws}</td>
                          <td className="text-[11px]">{row.losses}</td>
                          <td className="text-[11px]">{row.goalsFor}</td>
                          <td className="text-[11px]">{row.goalsAgainst}</td>
                          <td className="text-[11px]">{row.goalDiff}</td>
                          <td className="text-[11px] font-semibold">
                            {row.points}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Player leaderboard</h2>
              <div className="overflow-x-auto rounded-box border border-base-300/70">
                <table className="table table-xs">
                  <thead>
                    <tr className="bg-base-200/60 text-[11px]">
                      <th>#</th>
                      <th>Player</th>
                      <th>Team</th>
                      <th>Sport</th>
                      <th>Matches</th>
                      <th>Points</th>
                      <th>Avg rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerLeaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-xs py-4">
                          Player stats will appear once you start recording
                          match-level performance.
                        </td>
                      </tr>
                    ) : (
                      playerLeaderboard.map((row, index) => (
                        <tr key={row.playerId}>
                          <td className="text-[11px]">{index + 1}</td>
                          <td className="text-[11px]">{row.playerName}</td>
                          <td className="text-[11px]">
                            {row.teamName ?? "—"}
                          </td>
                          <td className="text-[11px]">{row.sport}</td>
                          <td className="text-[11px]">{row.matchesPlayed}</td>
                          <td className="text-[11px]">{row.pointsScored}</td>
                          <td className="text-[11px]">
                            {row.avgRating != null
                              ? row.avgRating.toFixed(1)
                              : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === "reports" && (
        <section aria-label="Performance reports">
          <h2 className="text-lg font-semibold mb-2">Performance reports</h2>
          <p className="text-sm text-base-content/70">
            This section will later show richer breakdowns per team and player,
            such as form over time, recent results, and top performers by sport.
          </p>
        </section>
      )}
    </div>
  );
}
