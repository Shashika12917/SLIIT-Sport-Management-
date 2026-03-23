"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requirePlayerManager() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "player_management") {
    redirect("/dashboard");
  }

  return { supabase, user };
}

export async function createPlayerProfile(formData: FormData) {
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

  if (!studentCode || !fullName || !sport) {
    // Basic required fields
    return;
  }

  // Validate student ID format: exactly IT + 8 digits (IT########).
  const studentPattern = /^IT\d{8}$/;
  if (!studentPattern.test(studentCode)) {
    // If format is invalid, do nothing; UI can later surface validation errors.
    return;
  }

  // Find or create the student registry entry (enforces unique Student ID).
  const { data: existingStudent, error: studentLookupError } = await supabase
    .from("students")
    .select("id")
    .eq("student_id", studentCode)
    .maybeSingle();

  if (studentLookupError) {
    console.error("Error looking up student:", studentLookupError);
    return;
  }

  let studentId = existingStudent?.id as string | undefined;

  if (!studentId) {
    const { data: insertedStudent, error: insertStudentError } = await supabase
      .from("students")
      .insert({
        student_id: studentCode,
        full_name: fullName,
        email: email || null,
        faculty: faculty || null,
        batch: batch || null,
      })
      .select("id")
      .single();

    if (insertStudentError || !insertedStudent) {
      console.error("Error inserting student:", insertStudentError);
      return;
    }

    studentId = insertedStudent.id;
  }

  const jerseyNo =
    jerseyRaw.length > 0 && !Number.isNaN(Number(jerseyRaw))
      ? Number(jerseyRaw)
      : null;

  const { error: playerError } = await supabase.from("players").insert({
    student_id: studentId,
    sport,
    position: position || null,
    jersey_no: jerseyNo,
    team_name: teamName || null,
    contact_no: contactNo || null,
    created_by: user.id,
  });

  if (playerError) {
    console.error("Error creating player profile:", playerError);
  }

  revalidatePath("/dashboard/player-management");
}

export async function updatePlayerDetails(formData: FormData) {
  const { supabase } = await requirePlayerManager();

  const id = String(formData.get("player_id") ?? "").trim();
  if (!id) {
    return;
  }

  const teamName = String(formData.get("team_name") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const jerseyRaw = String(formData.get("jersey_no") ?? "").trim();
  const contactNo = String(formData.get("contact_no") ?? "").trim();

  const updates: Record<string, unknown> = {};

  updates.team_name = teamName || null;
  updates.position = position || null;
  updates.contact_no = contactNo || null;

  if (jerseyRaw.length > 0 && !Number.isNaN(Number(jerseyRaw))) {
    updates.jersey_no = Number(jerseyRaw);
  } else if (jerseyRaw.length === 0) {
    updates.jersey_no = null;
  }

  const { error } = await supabase.from("players").update(updates).eq("id", id);
  if (error) {
    console.error("Error updating player:", error);
  }

  revalidatePath("/dashboard/player-management");
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

