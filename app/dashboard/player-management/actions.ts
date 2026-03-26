"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  isAllowedFaculty,
  isValidContactNumber,
  isValidContactOptional,
  isValidEmail,
  isValidJerseyOptional,
  isValidShortText,
  isValidSport,
  isValidStudentId,
} from "./create-player-validation";

export async function requirePlayerManager() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "player_management") {
    redirect("/dashboard");
  }

  return { supabase, user };
}

export type CreatePlayerActionState = {
  ok: boolean;
  message: string;
} | null;

export async function createPlayerProfileAction(
  _prevState: CreatePlayerActionState,
  formData: FormData,
): Promise<CreatePlayerActionState> {
  const { supabase, user } = await requirePlayerManager();

  const studentCode = String(formData.get("student_id") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const faculty = String(formData.get("faculty") ?? "").trim();
  const batch = String(formData.get("batch") ?? "").trim();

  const sport = String(formData.get("sport") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const jerseyRaw = String(formData.get("jersey_no") ?? "").trim();
  const teamName = String(formData.get("team_name") ?? "").trim();
  const contactNo = String(formData.get("contact_no") ?? "").trim();

  if (!studentCode || !isValidStudentId(studentCode)) {
    return {
      ok: false,
      message:
        "Student ID must be IT followed by exactly 8 digits (example: IT12345678).",
    };
  }

  if (!fullName) {
    return { ok: false, message: "Full name is required." };
  }

  if (!email || !isValidEmail(email)) {
    return {
      ok: false,
      message: "A valid email address is required.",
    };
  }

  if (!isAllowedFaculty(faculty)) {
    return {
      ok: false,
      message: "Select a valid faculty from the list.",
    };
  }

  if (!batch) {
    return { ok: false, message: "Batch is required." };
  }

  if (!isValidSport(sport)) {
    return {
      ok: false,
      message:
        sport.trim().length === 0
          ? "Sport is required."
          : "Sport must be a name (e.g. Football), not numbers only.",
    };
  }

  if (!isValidJerseyOptional(jerseyRaw)) {
    return {
      ok: false,
      message: "Jersey number must be a whole number (0 or greater), or left empty.",
    };
  }

  if (!contactNo || !isValidContactNumber(contactNo)) {
    return {
      ok: false,
      message: "Contact number must be 7–15 digits (numbers only).",
    };
  }

  const sportStored = sport;

  const { data: existingStudent, error: studentLookupError } = await supabase
    .from("students")
    .select("id")
    .eq("student_id", studentCode)
    .maybeSingle();

  if (studentLookupError) {
    console.error("Error looking up student:", studentLookupError);
    return {
      ok: false,
      message: studentLookupError.message || "Could not look up student record.",
    };
  }

  let studentId = existingStudent?.id as string | undefined;

  if (!studentId) {
    const { data: insertedStudent, error: insertStudentError } = await supabase
      .from("students")
      .insert({
        student_id: studentCode,
        full_name: fullName,
        email,
        faculty,
        batch,
      })
      .select("id")
      .single();

    if (insertStudentError || !insertedStudent) {
      console.error("Error inserting student:", insertStudentError);
      if (insertStudentError?.code === "23505") {
        return {
          ok: false,
          message:
            "This student ID is already registered. Use that student’s existing record or contact an admin.",
        };
      }
      return {
        ok: false,
        message:
          insertStudentError?.message ?? "Could not create the student record.",
      };
    }

    studentId = insertedStudent.id;
  }

  const jerseyNo =
    jerseyRaw.length > 0 && !Number.isNaN(Number(jerseyRaw))
      ? Number(jerseyRaw)
      : null;

  const { error: playerError } = await supabase.from("players").insert({
    student_id: studentId,
    sport: sportStored,
    position: position || null,
    jersey_no: jerseyNo,
    team_name: teamName || null,
    contact_no: contactNo || null,
    created_by: user.id,
  });

  if (playerError) {
    console.error("Error creating player profile:", playerError);
    if (playerError.code === "23505") {
      return {
        ok: false,
        message:
          "This student already has a player profile for that sport. Each student can only have one profile per sport.",
      };
    }
    return {
      ok: false,
      message: playerError.message || "Could not create the player profile.",
    };
  }

  revalidatePath("/dashboard/player-management", "page");
  revalidatePath("/dashboard/player-management", "layout");

  return {
    ok: true,
    message: `Player created: ${fullName} (${studentCode}) — ${sportStored}.`,
  };
}

export type UpdatePlayerDetailsResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updatePlayerDetails(
  formData: FormData,
): Promise<UpdatePlayerDetailsResult> {
  const { supabase } = await requirePlayerManager();

  const id = String(formData.get("player_id") ?? "").trim();
  if (!id) {
    return { ok: false, message: "Select a player to update." };
  }

  const teamName = String(formData.get("team_name") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const jerseyRaw = String(formData.get("jersey_no") ?? "").trim();
  const contactNo = String(formData.get("contact_no") ?? "").trim();

  if (!isValidShortText(teamName)) {
    return {
      ok: false,
      message: "Team name must be at most 200 characters.",
    };
  }
  if (!isValidShortText(position)) {
    return {
      ok: false,
      message: "Position must be at most 200 characters.",
    };
  }

  if (!isValidJerseyOptional(jerseyRaw)) {
    return {
      ok: false,
      message:
        "Jersey number must be a whole number (0 or greater), or leave empty to clear.",
    };
  }

  if (!isValidContactOptional(contactNo)) {
    return {
      ok: false,
      message: "Contact number must be 7–15 digits, or leave empty to clear.",
    };
  }

  const updates: Record<string, unknown> = {};

  updates.team_name = teamName || null;
  updates.position = position || null;
  updates.contact_no = contactNo || null;

  if (jerseyRaw.length > 0) {
    updates.jersey_no = Number(jerseyRaw);
  } else {
    updates.jersey_no = null;
  }

  const { error } = await supabase.from("players").update(updates).eq("id", id);
  if (error) {
    console.error("Error updating player:", error);
    return {
      ok: false,
      message: error.message || "Could not update player.",
    };
  }

  revalidatePath("/dashboard/player-management", "page");
  revalidatePath("/dashboard/player-management", "layout");

  return { ok: true };
}

const PLAYER_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type DeletePlayerResult =
  | { ok: true }
  | { ok: false; message: string };

export async function deletePlayer(
  playerId: string,
): Promise<DeletePlayerResult> {
  const { supabase } = await requirePlayerManager();

  const id = String(playerId ?? "").trim();
  if (!id || !PLAYER_ID_UUID_RE.test(id)) {
    return { ok: false, message: "Invalid player selection." };
  }

  const { data, error } = await supabase
    .from("players")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("Error deleting player:", error);
    if (error.code === "23503") {
      return {
        ok: false,
        message:
          "This player is still linked elsewhere (for example a society team or match results). Remove those links first, then try again.",
      };
    }
    return {
      ok: false,
      message: error.message || "Could not delete the player profile.",
    };
  }

  if (!data?.length) {
    return {
      ok: false,
      message: "Player not found or may have already been removed.",
    };
  }

  revalidatePath("/dashboard/player-management", "page");
  revalidatePath("/dashboard/player-management", "layout");

  return { ok: true };
}

export async function registerPlayerForEvent(formData: FormData) {
  const { supabase, user } = await requirePlayerManager();

  const playerId = String(formData.get("player_id") ?? "").trim();
  const eventId = String(formData.get("event_id") ?? "").trim();

  if (!playerId || !eventId) {
    return;
  }

  const { error } = await supabase.from("player_event_registrations").insert({
    player_id: playerId,
    event_id: eventId,
    created_by: user.id,
  });

  if (error) {
    // Unique constraint on (player_id, event_id) will surface here as well.
    console.error("Error registering player for event:", error);
  }

  revalidatePath("/dashboard/player-management");
}

