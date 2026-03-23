import { createClient } from "@/lib/supabase/server";

export type MatchStatus = "scheduled" | "completed" | "cancelled";

export type MatchTeamScoreInput = {
  teamId: string;
  score: number | null;
  extraInfo?: Record<string, unknown> | null;
};

export type MatchUpsertInput = {
  matchId?: string;
  eventId: string;
  venueId?: string | null;
  matchDate?: string; // ISO string
  status?: MatchStatus;
  matchType?: string | null;
  notes?: string | null;
  createdBy: string;
  teams: MatchTeamScoreInput[];
};

export type MatchTeamRow = {
  id: string;
  match_id: string;
  team_id: string;
  score: number | null;
  extra_info: Record<string, unknown> | null;
  is_winner: boolean;
  team?: {
    id: string;
    name: string;
    sport: string;
  } | null;
};

export type MatchRow = {
  id: string;
  event_id: string;
  venue_id: string | null;
  match_date: string;
  status: MatchStatus;
  match_type: string | null;
  notes: string | null;
  winner_team_id: string | null;
  event?: {
    id: string;
    name: string;
    event_date: string;
    venue: string;
    sport_type: string;
    status: string;
  } | null;
  teams?: MatchTeamRow[];
};

export type MatchFilters = {
  sportType?: string;
  fromDate?: string;
  toDate?: string;
  status?: MatchStatus;
};

type LeaderboardTeamRow = {
  teamId: string;
  teamName: string;
  sport: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

type RawMatchTeamRow = {
  id: string | number;
  match_id: string | number;
  team_id: string | number;
  score: number | null;
  extra_info: Record<string, unknown> | null;
  is_winner: boolean;
  team:
    | {
        id: string | number;
        name: string;
        sport: string;
      }
    | {
        id: string | number;
        name: string;
        sport: string;
      }[]
    | null;
};

type RawMatchRow = {
  id: string | number;
  event_id: string | number;
  venue_id: string | number | null;
  match_date: string;
  status: MatchStatus;
  match_type: string | null;
  notes: string | null;
  winner_team_id: string | number | null;
  event:
    | {
        id: string | number;
        name: string;
        event_date: string;
        venue: string;
        sport_type: string;
        status: string;
      }
    | {
        id: string | number;
        name: string;
        event_date: string;
        venue: string;
        sport_type: string;
        status: string;
      }[]
    | null;
};

type LeaderboardPlayerRow = {
  playerId: string;
  playerName: string;
  teamName: string | null;
  sport: string;
  matchesPlayed: number;
  pointsScored: number;
  avgRating: number | null;
};

type RawPlayerLeaderboardRow = {
  match_id: string | number;
  player_id: string | number;
  team_id: string | number | null;
  minutes_played: number | null;
  points_scored: number | null;
  rating: number | null;
  player:
    | {
        id: string | number;
        sport: string;
        student:
          | {
              full_name: string;
            }
          | {
              full_name: string;
            }[]
          | null;
      }
    | {
        id: string | number;
        sport: string;
        student:
          | {
              full_name: string;
            }
          | {
              full_name: string;
            }[]
          | null;
      }[]
    | null;
  team:
    | {
        id: string | number;
        name: string;
      }
    | {
        id: string | number;
        name: string;
      }[]
    | null;
  match:
    | {
        id: string | number;
        match_date: string;
        status: MatchStatus;
        event:
          | {
              sport_type: string;
            }
          | {
              sport_type: string;
            }[]
          | null;
      }
    | {
        id: string | number;
        match_date: string;
        status: MatchStatus;
        event:
          | {
              sport_type: string;
            }
          | {
              sport_type: string;
            }[]
          | null;
      }[]
    | null;
};

function calculateWinners(
  teams: MatchTeamScoreInput[]
): {
  winnerTeamId: string | null;
  isWinnerByTeamId: Record<string, boolean>;
} {
  const scoredTeams = teams.filter(
    (t) => typeof t.score === "number" && t.score !== null
  );

  if (scoredTeams.length === 0) {
    return { winnerTeamId: null, isWinnerByTeamId: {} };
  }

  let maxScore = -Infinity;
  for (const t of scoredTeams) {
    if ((t.score ?? 0) > maxScore) {
      maxScore = t.score ?? 0;
    }
  }

  const topTeams = scoredTeams.filter((t) => (t.score ?? 0) === maxScore);

  // Tie: no single winner
  if (topTeams.length !== 1) {
    return {
      winnerTeamId: null,
      isWinnerByTeamId: Object.fromEntries(
        teams.map((t) => [t.teamId, false])
      ),
    };
  }

  const winnerTeamId = topTeams[0].teamId;
  const isWinnerByTeamId: Record<string, boolean> = {};
  for (const t of teams) {
    isWinnerByTeamId[t.teamId] = t.teamId === winnerTeamId;
  }

  return { winnerTeamId, isWinnerByTeamId };
}

export async function upsertMatchWithScores(input: MatchUpsertInput) {
  const supabase = await createClient();

  if (input.teams.length < 2) {
    throw new Error("A match must have at least two teams.");
  }

  const { winnerTeamId, isWinnerByTeamId } = calculateWinners(input.teams);

  const matchPayload: Record<string, unknown> = {
    event_id: input.eventId,
    venue_id: input.venueId ?? null,
    match_date: input.matchDate ?? new Date().toISOString(),
    status: input.status ?? (winnerTeamId ? "completed" : "scheduled"),
    match_type: input.matchType ?? null,
    notes: input.notes ?? null,
    winner_team_id: winnerTeamId,
    created_by: input.createdBy,
  };

  let matchId = input.matchId ?? null;

  if (matchId) {
    const { error } = await supabase
      .from("matches")
      .update(matchPayload)
      .eq("id", matchId);

    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("matches")
      .insert(matchPayload)
      .select("id")
      .single();

    if (error) throw error;
    matchId = data?.id ?? null;
  }

  if (!matchId) {
    throw new Error("Failed to resolve match id after upsert.");
  }

  // Replace existing team rows for this match with the new scores.
  const { error: deleteError } = await supabase
    .from("match_teams")
    .delete()
    .eq("match_id", matchId);

  if (deleteError) throw deleteError;

  const teamRows = input.teams.map((t) => ({
    match_id: matchId,
    team_id: t.teamId,
    score: t.score,
    extra_info: t.extraInfo ?? null,
    is_winner: isWinnerByTeamId[t.teamId] ?? false,
    created_by: input.createdBy,
  }));

  const { error: insertError } = await supabase
    .from("match_teams")
    .insert(teamRows);

  if (insertError) throw insertError;

  return matchId;
}

export async function listMatchesWithTeams(
  filters: MatchFilters = {}
): Promise<MatchRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("matches")
    .select(
      `
        id,
        event_id,
        venue_id,
        match_date,
        status,
        match_type,
        notes,
        winner_team_id,
        event:events (
          id,
          name,
          event_date,
          venue,
          sport_type,
          status
        )
      `
    )
    .order("match_date", { ascending: false })
    .limit(100);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.fromDate) {
    query = query.gte("match_date", filters.fromDate);
  }

  if (filters.toDate) {
    query = query.lte("match_date", filters.toDate);
  }

  if (filters.sportType) {
    query = query.eq("event.sport_type", filters.sportType);
  }

  const { data: matches, error } = await query;
  if (error) throw error;

  const rawMatchRows = (matches ?? []) as RawMatchRow[];

  const matchRows: MatchRow[] = rawMatchRows.map((row) => {
    const eventValue = row.event;
    const rawEvent = Array.isArray(eventValue) ? eventValue[0] : eventValue;

    return {
      id: String(row.id),
      event_id: String(row.event_id),
      venue_id: row.venue_id !== null ? String(row.venue_id) : null,
      match_date: row.match_date,
      status: row.status,
      match_type: row.match_type,
      notes: row.notes,
      winner_team_id:
        row.winner_team_id !== null ? String(row.winner_team_id) : null,
      event: rawEvent
        ? {
            id: String(rawEvent.id),
            name: rawEvent.name,
            event_date: rawEvent.event_date,
            venue: rawEvent.venue,
            sport_type: rawEvent.sport_type,
            status: rawEvent.status,
          }
        : null,
    };
  });

  if (matchRows.length === 0) {
    return [];
  }

  const matchIds = matchRows.map((m) => m.id);

  const { data: teamRows, error: teamsError } = await supabase
    .from("match_teams")
    .select(
      `
        id,
        match_id,
        team_id,
        score,
        extra_info,
        is_winner,
        team:teams (
          id,
          name,
          sport
        )
      `
    )
    .in("match_id", matchIds);

  if (teamsError) throw teamsError;

  const teamsByMatchId = new Map<string, MatchTeamRow[]>();

  for (const row of (teamRows ?? []) as RawMatchTeamRow[]) {
    const teamValue = row.team;
    const rawTeam = Array.isArray(teamValue) ? teamValue[0] : teamValue;

    const normalized: MatchTeamRow = {
      id: String(row.id),
      match_id: String(row.match_id),
      team_id: String(row.team_id),
      score: row.score,
      extra_info: row.extra_info,
      is_winner: row.is_winner,
      team: rawTeam
        ? {
            id: String(rawTeam.id),
            name: rawTeam.name,
            sport: rawTeam.sport,
          }
        : null,
    };

    const key = normalized.match_id;
    if (!teamsByMatchId.has(key)) {
      teamsByMatchId.set(key, []);
    }
    teamsByMatchId.get(key)!.push(normalized);
  }

  return matchRows.map((m) => ({
    ...m,
    teams: teamsByMatchId.get(m.id) ?? [],
  }));
}

export async function saveMatchPlayerStats(input: {
  matchId: string;
  createdBy: string;
  stats: {
    playerId: string;
    teamId: string;
    minutesPlayed?: number | null;
    pointsScored?: number | null;
    rating?: number | null;
    metrics?: Record<string, unknown> | null;
  }[];
}) {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("match_player_stats")
    .delete()
    .eq("match_id", input.matchId);

  if (deleteError) throw deleteError;

  if (input.stats.length === 0) {
    return;
  }

  const rows = input.stats.map((s) => ({
    match_id: input.matchId,
    player_id: s.playerId,
    team_id: s.teamId,
    minutes_played: s.minutesPlayed ?? null,
    points_scored: s.pointsScored ?? null,
    rating: s.rating ?? null,
    metrics: s.metrics ?? null,
    created_by: input.createdBy,
  }));

  const { error: insertError } = await supabase
    .from("match_player_stats")
    .insert(rows);

  if (insertError) throw insertError;
}

export async function getTeamLeaderboard(options: {
  sportType?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<LeaderboardTeamRow[]> {
  const matches = await listMatchesWithTeams({
    sportType: options.sportType,
    fromDate: options.fromDate,
    toDate: options.toDate,
    status: "completed",
  });

  const table = new Map<string, LeaderboardTeamRow>();

  for (const match of matches) {
    const teams = match.teams ?? [];
    if (teams.length < 2) continue;

    for (const teamRow of teams) {
      const opponentRows = teams.filter((t) => t.team_id !== teamRow.team_id);
      const teamScore = teamRow.score ?? 0;

      let goalsAgainst = 0;
      for (const opp of opponentRows) {
        goalsAgainst += opp.score ?? 0;
      }

      const teamId = teamRow.team_id;
      const teamName = teamRow.team?.name ?? "Unknown";
      const sport = teamRow.team?.sport ?? (match.event?.sport_type ?? "Unknown");

      if (!table.has(teamId)) {
        table.set(teamId, {
          teamId,
          teamName,
          sport,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDiff: 0,
          points: 0,
        });
      }

      const row = table.get(teamId)!;

      row.played += 1;
      row.goalsFor += teamScore;
      row.goalsAgainst += goalsAgainst;
      row.goalDiff = row.goalsFor - row.goalsAgainst;

      if (teamRow.is_winner) {
        row.wins += 1;
        row.points += 3;
      } else {
        const maxScore = Math.max(
          ...teams.map((t) => (t.score ?? 0))
        );
        const isDraw = (teamScore === maxScore) && !teams.some((t) => t.is_winner);
        if (isDraw) {
          row.draws += 1;
          row.points += 1;
        } else {
          row.losses += 1;
        }
      }
    }
  }

  const rows = Array.from(table.values());

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });

  return rows;
}

export async function getPlayerLeaderboard(options: {
  sportType?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<LeaderboardPlayerRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("match_player_stats")
    .select(
      `
        match_id,
        player_id,
        team_id,
        minutes_played,
        points_scored,
        rating,
        player:players (
          id,
          sport,
          student:students (
            full_name
          )
        ),
        team:teams (
          id,
          name
        ),
        match:matches (
          id,
          match_date,
          status,
          event:events (
            sport_type
          )
        )
      `
    )
    .eq("match.status", "completed");

  if (options.fromDate) {
    query = query.gte("match.match_date", options.fromDate);
  }

  if (options.toDate) {
    query = query.lte("match.match_date", options.toDate);
  }

  if (options.sportType) {
    query = query.eq("match.event.sport_type", options.sportType);
  }

  const { data, error } = await query;
  if (error) throw error;

  const table = new Map<
    string,
    LeaderboardPlayerRow & { ratingSum: number; ratingCount: number }
  >();

  for (const row of (data ?? []) as RawPlayerLeaderboardRow[]) {
    const playerValue = row.player;
    const rawPlayer = Array.isArray(playerValue) ? playerValue[0] : playerValue;

    const studentValue = rawPlayer?.student ?? null;
    const rawStudent = Array.isArray(studentValue) ? studentValue[0] : studentValue;

    const matchValue = row.match;
    const rawMatch = Array.isArray(matchValue) ? matchValue[0] : matchValue;

    const eventValue = rawMatch?.event ?? null;
    const rawEvent = Array.isArray(eventValue) ? eventValue[0] : eventValue;

    const playerId = String(row.player_id);
    const playerName = rawStudent?.full_name ?? "Unknown";
    const sport =
      rawPlayer?.sport ??
      rawEvent?.sport_type ??
      "Unknown";
    const teamName = (Array.isArray(row.team) ? row.team[0] : row.team)?.name ?? null;

    if (!table.has(playerId)) {
      table.set(playerId, {
        playerId,
        playerName,
        teamName,
        sport,
        matchesPlayed: 0,
        pointsScored: 0,
        avgRating: null,
        ratingSum: 0,
        ratingCount: 0,
      });
    }

    const agg = table.get(playerId)!;
    agg.matchesPlayed += 1;
    agg.pointsScored += row.points_scored ?? 0;

    if (typeof row.rating === "number") {
      agg.ratingSum += row.rating;
      agg.ratingCount += 1;
    }
  }

  const rows: LeaderboardPlayerRow[] = [];

  for (const value of table.values()) {
    const avgRating =
      value.ratingCount > 0 ? value.ratingSum / value.ratingCount : null;
    rows.push({
      playerId: value.playerId,
      playerName: value.playerName,
      teamName: value.teamName,
      sport: value.sport,
      matchesPlayed: value.matchesPlayed,
      pointsScored: value.pointsScored,
      avgRating,
    });
  }

  rows.sort((a, b) => {
    if (b.pointsScored !== a.pointsScored) {
      return b.pointsScored - a.pointsScored;
    }
    const aRating = a.avgRating ?? 0;
    const bRating = b.avgRating ?? 0;
    if (bRating !== aRating) {
      return bRating - aRating;
    }
    return a.playerName.localeCompare(b.playerName);
  });

  return rows;
}

