"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import {
  createTeam,
  updateTeamStatus,
  deleteTeam,
  deleteSociety,
  addTeamMember,
  removeTeamMember,
  setTeamCaptain,
} from "@/lib/teams";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type DbErrorLike = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

async function getCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Not authenticated");
  }

  return user.id;
}

async function getCurrentUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error("Unable to verify role");
  }

  return {
    userId: user.id,
    role: profile?.role ?? null,
  };
}

function getCreatedByFromRelation(value: unknown): string | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    const first = value[0] as { created_by?: string } | undefined;
    return first?.created_by ?? null;
  }
  return (value as { created_by?: string }).created_by ?? null;
}

async function getScheduleWriteClient() {
  try {
    return createAdminClient();
  } catch {
    return await createClient();
  }
}

function isMissingEventTimeColumn(error: DbErrorLike | null) {
  if (!error) return false;
  const detail = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    (detail.includes("event_time") && (detail.includes("column") || detail.includes("schema cache")))
  );
}

function formatEventWriteError(prefix: string, error: DbErrorLike | null) {
  if (!error) return prefix;
  if (error.code === "23505") {
    return "Duplicate event exists for this date/time, venue, and sport.";
  }
  if (error.code === "42501") {
    return "Permission denied while saving event.";
  }
  return `${prefix}: ${error.message ?? "Unknown database error"}`;
}

export async function createSocietyAction(formData: FormData) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;

  if (!name) {
    throw new Error("Society name is required");
  }

  const { data: existing } = await supabase
    .from("societies")
    .select("id")
    .eq("name", name)
    .eq("created_by", userId)
    .limit(1)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("societies").insert({
      name,
      description,
      created_by: userId,
    });

    if (error) {
      throw error;
    }
  }

  revalidatePath("/dashboard/society-management");
}

export async function registerTeamAction(formData: FormData) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const societyId = formData.get("societyId") as string;
  const name = formData.get("name") as string;
  const sport = formData.get("sport") as string;

  if (!societyId || !name || !sport) {
    throw new Error("Missing required fields");
  }

  if (name.trim().length === 0) {
    throw new Error("Team name cannot be empty");
  }

  if (sport.trim().length === 0) {
    throw new Error("Sport cannot be empty");
  }

  // Check for duplicate team names within the same society
  const { data: existingTeam, error: checkError } = await supabase
    .from("teams")
    .select("id")
    .eq("society_id", societyId)
    .eq("name", name.trim())
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (checkError && checkError.code !== "PGRST116") {
    throw new Error("Unable to verify team uniqueness");
  }

  if (existingTeam) {
    throw new Error(`Team "${name}" already exists in this society`);
  }

  await createTeam({
    societyId,
    name: name.trim(),
    sport: sport.trim(),
    createdBy: userId,
  });

  revalidatePath("/dashboard/society-management");
}

export async function updateSocietyStatusAction(formData: FormData) {
  const supabase = await createClient();
  const societyId = formData.get("societyId") as string;
  const status = formData.get("status") as "active" | "inactive";

  if (!societyId || !status) {
    throw new Error("Missing required fields");
  }

  const { error } = await supabase
    .from("societies")
    .update({ status })
    .eq("id", societyId);

  if (error) {
    throw error;
  }

  revalidatePath("/dashboard/society-management");
}

export async function deleteSocietyAction(formData: FormData) {
  const societyId = formData.get("societyId") as string;

  if (!societyId) {
    throw new Error("Missing society id");
  }

  await deleteSociety(societyId);
  revalidatePath("/dashboard/society-management");
}

export async function updateTeamStatusAction(formData: FormData) {
  const teamId = formData.get("teamId") as string;
  const status = formData.get("status") as "active" | "inactive";

  if (!teamId || !status) {
    throw new Error("Missing required fields");
  }

  await updateTeamStatus(teamId, status);
  revalidatePath("/dashboard/society-management");
}

export async function deleteTeamAction(formData: FormData) {
  const teamId = formData.get("teamId") as string;

  if (!teamId) {
    throw new Error("Missing team id");
  }

  await deleteTeam(teamId);
  revalidatePath("/dashboard/society-management");
}

export async function addTeamMemberAction(formData: FormData) {
  const supabase = await createClient();
  const teamId = formData.get("teamId") as string;
  const playerId = formData.get("playerId") as string;
  const role = (formData.get("role") as string) || "member";

  if (!teamId || !playerId) {
    throw new Error("Missing required fields");
  }

  // Check if team exists and is active
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, sport, status")
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    throw new Error("Team not found");
  }

  if (team.status !== "active") {
    throw new Error("Cannot add members to inactive team");
  }

  // Check if player exists and get their sport
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id, sport, is_active")
    .eq("id", playerId)
    .single();

  if (playerError || !player) {
    throw new Error("Player not found");
  }

  if (!player.is_active) {
    throw new Error("Player is inactive and cannot be added to team");
  }

  // Validate player's sport matches team's sport
  if (player.sport !== team.sport) {
    throw new Error(`Player's sport (${player.sport}) does not match team's sport (${team.sport})`);
  }

  // Check if player is already a member of this team
  const { data: existingMember, error: existingError } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("player_id", playerId)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") {
    throw new Error("Unable to verify membership");
  }

  if (existingMember) {
    throw new Error("This player is already a member of this team");
  }

  await addTeamMember({ teamId, playerId, role });
  revalidatePath("/dashboard/society-management");
}

export async function removeTeamMemberAction(teamMemberId: string) {
  await removeTeamMember(teamMemberId);
  revalidatePath("/dashboard/society-management");
}

export async function setTeamCaptainAction(input: {
  teamId: string;
  playerId: string;
}) {
  await setTeamCaptain(input);
  revalidatePath("/dashboard/society-management");
}

export async function createTeamEventAndLinkAction(formData: FormData) {
  const { userId, role } = await getCurrentUserContext();
  const db = await getScheduleWriteClient();

  const teamId = formData.get("teamId") as string;
  const name = formData.get("name") as string;
  const eventDate = formData.get("eventDate") as string;
  const eventTime = (formData.get("eventTime") as string) || undefined;
  const venue = formData.get("venue") as string;
  const sportType = formData.get("sportType") as string;

  if (!teamId || !name || !eventDate || !venue || !sportType) {
    throw new Error("Missing required fields");
  }

  if (name.trim().length === 0) {
    throw new Error("Event name cannot be empty");
  }

  if (role !== "society_management") {
    throw new Error("Not authorized to manage schedules");
  }

  // Validate event date is not in the past
  const eventDateObj = new Date(eventDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (eventDateObj < today) {
    throw new Error("Event date cannot be in the past");
  }

  const { data: team, error: teamError } = await db
    .from("teams")
    .select("id, created_by, status")
    .eq("id", teamId)
    .maybeSingle();

  if (teamError || !team) {
    throw new Error("Team not found");
  }

  if (team.created_by !== userId) {
    throw new Error("Not allowed to create schedules for this team");
  }

  if (team.status !== "active") {
    throw new Error("Cannot add schedules to inactive team");
  }

  // Check for conflicting events at the same venue on the same date/time
  const eventDateTimeStr = eventTime ? `${eventDate}T${eventTime}` : `${eventDate}T00:00`;
  const { data: conflictingEvents, error: conflictError } = await db
    .from("events")
    .select("id, name, event_time")
    .eq("venue", venue)
    .eq("event_date", eventDate)
    .eq("sport_type", sportType);

  if (conflictError && conflictError.code !== "PGRST116") {
    throw new Error("Unable to check for scheduling conflicts");
  }

  if (conflictingEvents && conflictingEvents.length > 0) {
    // Check if any events have the same or overlapping time (within 30 min window)
    if (eventTime) {
      const conflicting = conflictingEvents.find((evt) => {
        if (!evt.event_time) return false;
        const timeDiff = Math.abs(
          new Date(`2000-01-01T${eventTime}`).getTime() -
          new Date(`2000-01-01T${evt.event_time}`).getTime()
        );
        return timeDiff < 30 * 60 * 1000; // 30 minute window
      });
      if (conflicting) {
        throw new Error(
          `Event conflict: "${conflicting.name}" is scheduled at the same venue and time`
        );
      }
    }
  }

  const eventId = randomUUID();

  const baseEventPayload = {
    id: eventId,
    name: name.trim(),
    event_date: eventDate,
    venue: venue.trim(),
    sport_type: sportType.trim(),
    created_by: userId,
  };

  let { error } = await db
    .from("events")
    .insert({
      ...baseEventPayload,
      event_time: eventTime ? `${eventTime}:00` : null,
    });

  if (isMissingEventTimeColumn(error)) {
    ({ error } = await db.from("events").insert(baseEventPayload));
  }

  if (error) {
    throw new Error(formatEventWriteError("Failed to save event", error));
  }

  const { error: linkError } = await db.from("team_event_links").insert({
    team_id: teamId,
    event_id: eventId,
  });

  if (linkError) {
    throw new Error(formatEventWriteError("Failed to link event to team", linkError));
  }

  revalidatePath("/dashboard/society-management");
}

export async function removeTeamScheduleItemAction(formData: FormData) {
  const { userId, role } = await getCurrentUserContext();
  const db = await getScheduleWriteClient();
  const linkId = formData.get("linkId") as string;

  if (!linkId) {
    throw new Error("Missing schedule link id");
  }

  if (role !== "society_management") {
    throw new Error("Not authorized to manage schedules");
  }

  const { data: scheduleLink, error: scheduleLinkError } = await db
    .from("team_event_links")
    .select("id, team:teams(created_by)")
    .eq("id", linkId)
    .maybeSingle();

  const createdBy = getCreatedByFromRelation(scheduleLink?.team);
  if (scheduleLinkError || !scheduleLink || createdBy !== userId) {
    throw new Error("Not allowed to remove this schedule item");
  }

  const { error } = await db.from("team_event_links").delete().eq("id", linkId);
  if (error) {
    throw new Error("Failed to delete schedule item");
  }

  revalidatePath("/dashboard/society-management");
}

export async function updateEventDateTimeAction(formData: FormData) {
  const { userId, role } = await getCurrentUserContext();
  const db = await getScheduleWriteClient();
  const eventId = formData.get("eventId") as string;
  const eventDate = formData.get("eventDate") as string;
  const eventTime = (formData.get("eventTime") as string) || undefined;

  if (!eventId || !eventDate) {
    throw new Error("Missing event id or date");
  }

  if (role !== "society_management") {
    throw new Error("Not authorized to manage schedules");
  }

  // Validate event date is not in the past
  const eventDateObj = new Date(eventDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (eventDateObj < today) {
    throw new Error("Event date cannot be in the past");
  }

  const { data: eventLink, error: eventLinkError } = await db
    .from("team_event_links")
    .select("id, event:events(id, venue, sport_type, created_by), team:teams(created_by)")
    .eq("event_id", eventId)
    .limit(1)
    .maybeSingle();

  const createdBy = getCreatedByFromRelation(eventLink?.team);
  if (eventLinkError || !eventLink || createdBy !== userId) {
    throw new Error("Not allowed to update this event");
  }

  // Get current event details for conflict checking
  const { data: currentEvent } = await db
    .from("events")
    .select("id, venue, sport_type, event_time")
    .eq("id", eventId)
    .single();

  // Check for conflicts if date or time is changing
  if (currentEvent) {
    const { data: conflictingEvents, error: conflictError } = await db
      .from("events")
      .select("id, name, event_time")
      .eq("venue", currentEvent.venue)
      .eq("event_date", eventDate)
      .eq("sport_type", currentEvent.sport_type)
      .neq("id", eventId);

    if (conflictError && conflictError.code !== "PGRST116") {
      throw new Error("Unable to check for scheduling conflicts");
    }

    if (conflictingEvents && conflictingEvents.length > 0 && eventTime) {
      const conflicting = conflictingEvents.find((evt) => {
        if (!evt.event_time) return false;
        const timeDiff = Math.abs(
          new Date(`2000-01-01T${eventTime}`).getTime() -
          new Date(`2000-01-01T${evt.event_time}`).getTime()
        );
        return timeDiff < 30 * 60 * 1000; // 30 minute window
      });
      if (conflicting) {
        throw new Error(
          `Event conflict: "${conflicting.name}" is already scheduled at this venue and time`
        );
      }
    }
  }

  const updatePayload = {
    event_date: eventDate,
    event_time: eventTime ? `${eventTime}:00` : null,
  };

  let { error } = await db
    .from("events")
    .update(updatePayload)
    .eq("id", eventId);

  if (isMissingEventTimeColumn(error)) {
    ({ error } = await db
      .from("events")
      .update({ event_date: eventDate })
      .eq("id", eventId));
  }

  if (error) {
    throw new Error(formatEventWriteError("Failed to update event date and time", error));
  }

  revalidatePath("/dashboard/society-management");
}

