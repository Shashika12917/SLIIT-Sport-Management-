'use server';

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { upsertMatchWithScores } from "@/lib/results";

export async function recordMatchResult(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const eventId = String(formData.get("event_id") ?? "").trim();
  const matchDate = String(formData.get("match_date") ?? "").trim();
  const matchType = String(formData.get("match_type") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const team1Id = String(formData.get("team1_id") ?? "").trim();
  const team2Id = String(formData.get("team2_id") ?? "").trim();

  const team1ScoreRaw = String(formData.get("team1_score") ?? "").trim();
  const team2ScoreRaw = String(formData.get("team2_score") ?? "").trim();

  if (!eventId || !team1Id || !team2Id) {
    return;
  }

  const team1Score =
    team1ScoreRaw === "" ? null : Number.isNaN(Number(team1ScoreRaw)) ? null : Number(team1ScoreRaw);
  const team2Score =
    team2ScoreRaw === "" ? null : Number.isNaN(Number(team2ScoreRaw)) ? null : Number(team2ScoreRaw);

  const matchDateIso = matchDate ? new Date(matchDate).toISOString() : new Date().toISOString();

  await upsertMatchWithScores({
    eventId,
    matchDate: matchDateIso,
    matchType,
    notes,
    createdBy: user.id,
    teams: [
      { teamId: team1Id, score: team1Score },
      { teamId: team2Id, score: team2Score },
    ],
  });

  revalidatePath("/dashboard/results-management");
}

