"use server";

import { revalidatePath } from "next/cache";
import {
  createTeam,
  updateTeamStatus,
  deleteTeam,
  deleteSociety,
  addTeamMember,
  removeTeamMember,
  setTeamCaptain,
  linkTeamToEvent,
  unlinkTeamEvent,
  updateEventDateTime,
} from "@/lib/teams";
import { createClient } from "@/lib/supabase/server";

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
  const userId = await getCurrentUserId();
  const societyId = formData.get("societyId") as string;
  const name = formData.get("name") as string;
  const sport = formData.get("sport") as string;

  if (!societyId || !name || !sport) {
    throw new Error("Missing required fields");
  }

  await createTeam({
    societyId,
    name,
    sport,
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
  const teamId = formData.get("teamId") as string;
  const playerId = formData.get("playerId") as string;
  const role = (formData.get("role") as string) || "member";

  if (!teamId || !playerId) {
    throw new Error("Missing required fields");
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
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  const teamId = formData.get("teamId") as string;
  const name = formData.get("name") as string;
  const eventDate = formData.get("eventDate") as string;
  const eventTime = (formData.get("eventTime") as string) || undefined;
  const venue = formData.get("venue") as string;
  const sportType = formData.get("sportType") as string;

  if (!teamId || !name || !eventDate || !venue || !sportType) {
    throw new Error("Missing required fields");
  }

  // Combine eventDate and eventTime into ISO format
  const eventDateTime = eventTime ? `${eventDate}T${eventTime}:00` : eventDate;

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      name,
      event_date: eventDateTime,
      venue,
      sport_type: sportType,
      created_by: userId,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await linkTeamToEvent({
    teamId,
    eventId: event.id,
  });

  revalidatePath("/dashboard/society-management");
}

export async function removeTeamScheduleItemAction(formData: FormData) {
  const linkId = formData.get("linkId") as string;

  if (!linkId) {
    throw new Error("Missing schedule link id");
  }

  await unlinkTeamEvent(linkId);
  revalidatePath("/dashboard/society-management");
}

export async function updateEventDateTimeAction(formData: FormData) {
  const eventId = formData.get("eventId") as string;
  const eventDate = formData.get("eventDate") as string;
  const eventTime = (formData.get("eventTime") as string) || undefined;

  if (!eventId || !eventDate) {
    throw new Error("Missing event id or date");
  }

  await updateEventDateTime(eventId, eventDate, eventTime);
  revalidatePath("/dashboard/society-management");
}

