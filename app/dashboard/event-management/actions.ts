'use server';

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const name = String(formData.get("name") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "");
  const venue = String(formData.get("venue") ?? "").trim();
  const sportType = String(formData.get("sport_type") ?? "").trim();

  if (!name || !eventDate || !venue || !sportType) {
    // Basic required-field guard; you can enhance this later.
    return;
  }

  const { error } = await supabase.from("events").insert({
    name,
    event_date: eventDate,
    venue,
    sport_type: sportType,
    created_by: user.id,
  });

  if (error) {
    console.error("Error creating event:", error);
    return;
  }

  revalidatePath("/dashboard/event-management");
}

export async function cancelEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  const { error } = await supabase
    .from("events")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) {
    console.error("Error cancelling event:", error);
    return;
  }

  revalidatePath("/dashboard/event-management");
}

