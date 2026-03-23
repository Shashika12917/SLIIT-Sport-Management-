 "use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireVenueManager() {
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

  if (profileError || profile?.role !== "venue_management") {
    redirect("/dashboard");
  }

  return { supabase, user };
}

export async function createVenue(formData: FormData) {
  const { supabase, user } = await requireVenueManager();

  const name = String(formData.get("name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const capacityRaw = formData.get("capacity");
  const openTime = String(formData.get("open_time") ?? "").trim();
  const closeTime = String(formData.get("close_time") ?? "").trim();

  if (!name) {
    throw new Error("Venue name is required");
  }

  const capacity =
    typeof capacityRaw === "string" && capacityRaw.length > 0
      ? Number(capacityRaw)
      : null;

  await supabase.from("venues").insert({
    name,
    location: location || null,
    capacity,
    open_time: openTime || undefined,
    close_time: closeTime || undefined,
    created_by: user.id,
  });

  revalidatePath("/dashboard/venue-management");
}

export async function updateVenue(formData: FormData) {
  const { supabase } = await requireVenueManager();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!id) {
    throw new Error("Venue id is required");
  }

  const updates: Record<string, unknown> = {};

  if (status) {
    updates.status = status;
  }

  const name = formData.get("name");
  const location = formData.get("location");
  const capacityRaw = formData.get("capacity");
  const openTime = formData.get("open_time");
  const closeTime = formData.get("close_time");

  if (typeof name === "string" && name.trim().length > 0) {
    updates.name = name.trim();
  }

  if (typeof location === "string") {
    updates.location = location.trim() || null;
  }

  if (typeof capacityRaw === "string") {
    updates.capacity = capacityRaw.length > 0 ? Number(capacityRaw) : null;
  }

  if (typeof openTime === "string" && openTime.length > 0) {
    updates.open_time = openTime;
  }

  if (typeof closeTime === "string" && closeTime.length > 0) {
    updates.close_time = closeTime;
  }

  await supabase.from("venues").update(updates).eq("id", id);

  revalidatePath("/dashboard/venue-management");
}

export async function createBooking(formData: FormData) {
  const { supabase, user } = await requireVenueManager();

  const venueId = String(formData.get("venue_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  const type = String(formData.get("booking_type") ?? "blocked");
  const notes = String(formData.get("notes") ?? "");
  const eventIdRaw = formData.get("event_id");

  if (!venueId || !date || !startTime || !endTime) {
    throw new Error("Venue, date, start time, and end time are required");
  }

  const startIso = new Date(`${date}T${startTime}:00`).toISOString();
  const endIso = new Date(`${date}T${endTime}:00`).toISOString();

  const payload: Record<string, unknown> = {
    venue_id: venueId,
    booking_type: type,
    booking_start: startIso,
    booking_end: endIso,
    notes: notes || null,
    created_by: user.id,
  };

  if (type === "event" && typeof eventIdRaw === "string" && eventIdRaw) {
    payload.event_id = eventIdRaw;
  }

  await supabase.from("venue_bookings").insert(payload);

  revalidatePath("/dashboard/venue-management");
}

export async function deleteBooking(formData: FormData) {
  const { supabase } = await requireVenueManager();

  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Booking id is required");
  }

  await supabase.from("venue_bookings").delete().eq("id", id);

  revalidatePath("/dashboard/venue-management");
}

