import { createClient } from "@/lib/supabase/server";

export type TeamScheduleItem = {
  id: string;
  event: {
    id: string;
    name: string;
    event_date: string;
    venue: string;
    sport_type: string;
    status: string;
  } | null;
};

export async function getSocietiesForUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("societies")
    .select("*")
    .eq("created_by", userId)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getTeamsForSociety(societyId: string, includeInactive = false) {
  const supabase = await createClient();
  let query = supabase.from("teams").select("*").eq("society_id", societyId);

  if (!includeInactive) {
    query = query.eq("status", "active");
  }

  const { data, error } = await query.order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createTeam(input: {
  societyId: string;
  name: string;
  sport: string;
  createdBy: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .insert({
      society_id: input.societyId,
      name: input.name,
      sport: input.sport,
      created_by: input.createdBy,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateTeamStatus(teamId: string, status: "active" | "inactive") {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .update({ status })
    .eq("id", teamId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTeam(teamId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) throw error;
}

export async function deleteSociety(societyId: string) {
  const supabase = await createClient();

  const { error: deleteTeamsError } = await supabase
    .from("teams")
    .delete()
    .eq("society_id", societyId);

  if (deleteTeamsError) throw deleteTeamsError;

  const { error: deleteSocietyError } = await supabase
    .from("societies")
    .delete()
    .eq("id", societyId);

  if (deleteSocietyError) throw deleteSocietyError;
}

export async function getTeamMembers(teamId: string, includeInactive = false) {
  const supabase = await createClient();

  let query = supabase
    .from("team_members")
    .select(
      `
        id,
        role,
        is_active,
        joined_at,
        player:players (
          id,
          sport,
          position,
          jersey_no,
          student:students (
            id,
            student_id,
            full_name,
            email,
            faculty,
            batch
          )
        )
      `
    )
    .eq("team_id", teamId);

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query.order("joined_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addTeamMember(input: {
  teamId: string;
  playerId: string;
  role?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .insert({
      team_id: input.teamId,
      player_id: input.playerId,
      role: input.role ?? "member",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function removeTeamMember(teamMemberId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .update({ is_active: false })
    .eq("id", teamMemberId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function setTeamCaptain(input: { teamId: string; playerId: string }) {
  const supabase = await createClient();

  const { data: member, error: memberError } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", input.teamId)
    .eq("player_id", input.playerId)
    .eq("is_active", true)
    .single();

  if (memberError) throw memberError;

  const { error: clearError } = await supabase
    .from("team_members")
    .update({ role: "member" })
    .eq("team_id", input.teamId)
    .eq("role", "captain")
    .eq("is_active", true);

  if (clearError) throw clearError;

  const { data, error } = await supabase
    .from("team_members")
    .update({ role: "captain", is_active: true })
    .eq("id", member.id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function linkTeamToEvent(input: {
  teamId: string;
  eventId: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_event_links")
    .insert({
      team_id: input.teamId,
      event_id: input.eventId,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function unlinkTeamEvent(linkId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("team_event_links")
    .delete()
    .eq("id", linkId);

  if (error) throw error;
}

export async function getTeamSchedule(teamId: string): Promise<TeamScheduleItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_event_links")
    .select(
      `
        id,
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
    .eq("team_id", teamId);

  if (error) throw error;

  const rows = (data ?? []) as {
    id: string | number;
    event: {
      id: string | number;
      name: string;
      event_date: string;
      venue: string;
      sport_type: string;
      status: string;
    } | {
      id: string | number;
      name: string;
      event_date: string;
      venue: string;
      sport_type: string;
      status: string;
    }[] | null;
  }[];

  const normalized: TeamScheduleItem[] = rows.map((row) => {
    const eventValue = row.event;
    const rawEvent = Array.isArray(eventValue) ? eventValue[0] : eventValue;

    if (!rawEvent) {
      return {
        id: String(row.id),
        event: null,
      };
    }

    return {
      id: String(row.id),
      event: {
        id: String(rawEvent.id),
        name: String(rawEvent.name),
        event_date: String(rawEvent.event_date),
        venue: String(rawEvent.venue),
        sport_type: String(rawEvent.sport_type),
        status: String(rawEvent.status),
      },
    };
  });

  // Sort by event date (with null events at the end)
  normalized.sort((a, b) => {
    if (!a.event?.event_date) return 1;
    if (!b.event?.event_date) return -1;
    return new Date(a.event.event_date).getTime() - new Date(b.event.event_date).getTime();
  });

  return normalized;
}

export async function updateEventDateTime(eventId: string, eventDate: string, eventTime?: string) {
  const supabase = await createClient();

  // Combine date and time if time is provided
  let finalDateTime = eventDate;
  if (eventTime) {
    finalDateTime = `${eventDate}T${eventTime}:00`;
  }

  const { data, error } = await supabase
    .from("events")
    .update({ event_date: finalDateTime })
    .eq("id", eventId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

