import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createVenue, updateVenue, createBooking, deleteBooking } from "./actions";

async function VenueManagementContent() {
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

  const todayDate = new Date();
  const today = todayDate.toISOString().slice(0, 10);
  const sevenDaysAhead = new Date(todayDate);
  sevenDaysAhead.setDate(todayDate.getDate() + 7);
  const sevenDaysAheadStr = sevenDaysAhead.toISOString().slice(0, 10);

  const { data: venues } = await supabase
    .from("venues")
    .select("*")
    .eq("status", "active")
    .order("name", { ascending: true });

  const { data: bookings } = await supabase
    .from("venue_bookings")
    .select(
      `
        *,
        venues!inner ( name ),
        events ( name, sport_type, event_date )
      `
    )
    .gte("booking_start", `${today}T00:00:00.000Z`)
    .lte("booking_start", `${today}T23:59:59.999Z`)
    .order("booking_start", { ascending: true });

  const { data: upcomingBookings } = await supabase
    .from("venue_bookings")
    .select(
      `
        *,
        venues!inner ( name ),
        events ( name, sport_type, event_date )
      `
    )
    .gt("booking_start", `${today}T23:59:59.999Z`)
    .lte("booking_start", `${sevenDaysAheadStr}T23:59:59.999Z`)
    .order("booking_start", { ascending: true });

  const { data: events } = await supabase
    .from("events")
    .select("id, name, sport_type, event_date")
    .order("event_date", { ascending: true });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Venue Management</h1>
        <p className="text-muted-foreground">
          Manage venues, facilities, and availability.
        </p>
      </header>

      <section className="card bg-base-100 shadow-sm border">
        <div className="card-body space-y-6">
          <form action={createVenue} className="space-y-4">
            <div className="flex flex-col gap-3 border-b border-base-300 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="card-title text-sm font-semibold uppercase tracking-wide text-neutral">
                  New Venue
                </h2>
                <p className="text-sm text-base-content/70">
                  Add a sports venue with basic details and default opening
                  hours.
                </p>
              </div>

              <button type="submit" className="btn btn-primary btn-sm sm:btn-md">
                Create Venue
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="form-control">
                <label htmlFor="name" className="label py-1">
                  <span className="label-text text-xs font-medium">Name</span>
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  type="text"
                  placeholder="Main ground"
                  className="input input-sm input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label htmlFor="location" className="label py-1">
                  <span className="label-text text-xs font-medium">
                    Location
                  </span>
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="North campus"
                  className="input input-sm input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label htmlFor="capacity" className="label py-1">
                  <span className="label-text text-xs font-medium">
                    Capacity (informational)
                  </span>
                </label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min={0}
                  placeholder="500"
                  className="input input-sm input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label htmlFor="open_time" className="label py-1">
                  <span className="label-text text-xs font-medium">
                    Default hours
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="open_time"
                    name="open_time"
                    type="time"
                    className="input input-sm input-bordered w-full"
                    defaultValue="08:00"
                  />
                  <span className="text-xs text-base-content/60 self-center">
                    to
                  </span>
                  <input
                    id="close_time"
                    name="close_time"
                    type="time"
                    className="input input-sm input-bordered w-full"
                    defaultValue="22:00"
                  />
                </div>
              </div>
            </div>
          </form>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral">
                Venues
              </h2>
              <span className="badge badge-outline badge-sm">
                {venues?.length ?? 0}{" "}
                {venues && venues.length === 1 ? "venue" : "venues"}
              </span>
            </div>

            {venues && venues.length > 0 ? (
              <div className="overflow-x-auto rounded-box border border-base-300">
                <table className="table table-zebra-zebra table-sm lg:table-md">
                  <thead className="bg-base-200">
                    <tr className="text-xs uppercase tracking-wide text-base-content/70">
                      <th>Name</th>
                      <th>Location</th>
                      <th>Capacity</th>
                      <th>Status</th>
                      <th>Default hours</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {venues.map((venue) => (
                      <tr key={venue.id}>
                        <td className="whitespace-nowrap text-sm">
                          {venue.name}
                        </td>
                        <td className="whitespace-nowrap text-sm">
                          {venue.location ?? "—"}
                        </td>
                        <td className="whitespace-nowrap text-sm">
                          {venue.capacity ?? "—"}
                        </td>
                        <td className="whitespace-nowrap text-sm capitalize">
                          <span
                            className={
                              venue.status === "inactive"
                                ? "badge badge-sm badge-outline border-warning text-warning"
                                : "badge badge-sm badge-outline border-primary text-primary"
                            }
                          >
                            {venue.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap text-sm">
                          {venue.open_time?.slice(0, 5)} –{" "}
                          {venue.close_time?.slice(0, 5)}
                        </td>
                        <td className="whitespace-nowrap text-right">
                          <form action={updateVenue} className="inline-flex gap-2">
                            <input type="hidden" name="id" value={venue.id} />
                            <input
                              type="hidden"
                              name="status"
                              value={
                                venue.status === "active"
                                  ? "inactive"
                                  : "active"
                              }
                            />
                            <button
                              type="submit"
                              className="btn btn-ghost btn-xs"
                            >
                              {venue.status === "active"
                                ? "Deactivate"
                                : "Activate"}
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info mt-2">
                <span className="text-sm">
                  No venues yet. Use the form above to add your first venue.
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="card bg-base-100 shadow-sm border">
        <div className="card-body space-y-6">
          <div className="flex flex-col gap-3 border-b border-base-300 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="card-title text-sm font-semibold uppercase tracking-wide text-neutral">
                Today&apos;s Venue Schedule
              </h2>
              <p className="text-sm text-base-content/70">
                Quick view of bookings and ability to block time slots.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
            <form action={createBooking} className="space-y-4">
              <div className="space-y-3">
                <div className="form-control">
                  <label htmlFor="booking_venue_id" className="label py-1">
                    <span className="label-text text-xs font-medium">
                      Venue
                    </span>
                  </label>
                  <select
                    id="booking_venue_id"
                    name="venue_id"
                    className="select select-sm select-bordered w-full"
                    required
                  >
                    <option value="">Select a venue</option>
                    {venues?.map((venue) => (
                      <option key={venue.id} value={venue.id}>
                        {venue.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label htmlFor="booking_date" className="label py-1">
                    <span className="label-text text-xs font-medium">Date</span>
                  </label>
                  <input
                    id="booking_date"
                    name="date"
                    type="date"
                    required
                    defaultValue={today}
                    className="input input-sm input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs font-medium">
                      Time range
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="booking_start_time"
                      name="start_time"
                      type="time"
                      required
                      className="input input-sm input-bordered w-full"
                    />
                    <span className="text-xs text-base-content/60 self-center">
                      to
                    </span>
                    <input
                      id="booking_end_time"
                      name="end_time"
                      type="time"
                      required
                      className="input input-sm input-bordered w-full"
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label htmlFor="booking_type" className="label py-1">
                    <span className="label-text text-xs font-medium">
                      Booking type
                    </span>
                  </label>
                  <select
                    id="booking_type"
                    name="booking_type"
                    className="select select-sm select-bordered w-full"
                    defaultValue="blocked"
                  >
                    <option value="blocked">Blocked</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="event">Event assignment (provide event id)</option>
                  </select>
                </div>

                <div className="form-control">
                  <label htmlFor="booking_event_id" className="label py-1">
                    <span className="label-text text-xs font-medium">
                      Event (for event bookings)
                    </span>
                  </label>
                  <select
                    id="booking_event_id"
                    name="event_id"
                    className="select select-sm select-bordered w-full"
                    defaultValue=""
                  >
                    <option value="">
                      No event / blocked or maintenance slot
                    </option>
                    {events?.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name} – {event.sport_type} (
                        {event.event_date
                          ? new Date(event.event_date).toLocaleDateString()
                          : "-"}
                        )
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label htmlFor="booking_notes" className="label py-1">
                    <span className="label-text text-xs font-medium">
                      Notes
                    </span>
                  </label>
                  <textarea
                    id="booking_notes"
                    name="notes"
                    className="textarea textarea-sm textarea-bordered w-full"
                    rows={3}
                    placeholder="Optional: purpose, team, etc."
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-sm sm:btn-md">
                Create Booking
              </button>
            </form>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral">
                  Bookings Today
                </h3>
                <span className="badge badge-outline badge-sm">
                  {bookings?.length ?? 0}{" "}
                  {bookings && bookings.length === 1 ? "booking" : "bookings"}
                </span>
              </div>

              {bookings && bookings.length > 0 ? (
                <div className="overflow-x-auto rounded-box border border-base-300">
                  <table className="table table-zebra-zebra table-sm lg:table-md">
                    <thead className="bg-base-200">
                      <tr className="text-xs uppercase tracking-wide text-base-content/70">
                        <th>Venue</th>
                        <th>Time</th>
                        <th>Type</th>
                        <th>Event</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr key={booking.id}>
                          <td className="whitespace-nowrap text-sm">
                            {booking.venues?.name ?? "—"}
                          </td>
                          <td className="whitespace-nowrap text-sm">
                            {booking.booking_start
                              ? new Date(booking.booking_start)
                                  .toISOString()
                                  .slice(11, 16)
                              : "-"}{" "}
                            –{" "}
                            {booking.booking_end
                              ? new Date(booking.booking_end)
                                  .toISOString()
                                  .slice(11, 16)
                              : "-"}
                          </td>
                          <td className="whitespace-nowrap text-sm capitalize">
                            <span className="badge badge-sm badge-outline">
                              {booking.booking_type}
                            </span>
                          </td>
                          <td className="whitespace-nowrap text-sm">
                            {booking.events
                              ? `${booking.events.name} (${booking.events.sport_type})`
                              : "—"}
                          </td>
                          <td className="whitespace-nowrap text-right">
                            <form action={deleteBooking}>
                              <input
                                type="hidden"
                                name="id"
                                value={booking.id}
                              />
                              <button
                                type="submit"
                                className="btn btn-ghost btn-xs text-error"
                              >
                                Remove
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-info mt-2">
                  <span className="text-sm">
                    No bookings for today yet. Use the form to block a time slot
                    or assign a venue to an event.
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between pt-2 border-t border-base-300">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral">
                    Upcoming Bookings (next 7 days)
                  </h3>
                  <span className="badge badge-outline badge-sm">
                    {upcomingBookings?.length ?? 0}{" "}
                    {upcomingBookings && upcomingBookings.length === 1
                      ? "booking"
                      : "bookings"}
                  </span>
                </div>

                {upcomingBookings && upcomingBookings.length > 0 ? (
                  <div className="overflow-x-auto rounded-box border border-base-300">
                    <table className="table table-zebra-zebra table-sm lg:table-md">
                      <thead className="bg-base-200">
                        <tr className="text-xs uppercase tracking-wide text-base-content/70">
                          <th>Date</th>
                          <th>Venue</th>
                          <th>Time</th>
                          <th>Type</th>
                          <th>Event</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingBookings.map((booking) => (
                          <tr key={booking.id}>
                            <td className="whitespace-nowrap text-sm">
                              {booking.booking_start
                                ? new Date(
                                    booking.booking_start
                                  ).toLocaleDateString()
                                : "-"}
                            </td>
                            <td className="whitespace-nowrap text-sm">
                              {booking.venues?.name ?? "—"}
                            </td>
                            <td className="whitespace-nowrap text-sm">
                              {booking.booking_start
                                ? new Date(booking.booking_start)
                                    .toISOString()
                                    .slice(11, 16)
                                : "-"}{" "}
                              –{" "}
                              {booking.booking_end
                                ? new Date(booking.booking_end)
                                    .toISOString()
                                    .slice(11, 16)
                                : "-"}
                            </td>
                            <td className="whitespace-nowrap text-sm capitalize">
                              <span className="badge badge-sm badge-outline">
                                {booking.booking_type}
                              </span>
                            </td>
                            <td className="whitespace-nowrap text-sm">
                              {booking.events
                                ? `${booking.events.name} (${booking.events.sport_type})`
                                : "—"}
                            </td>
                            <td className="whitespace-nowrap text-right">
                              <form action={deleteBooking}>
                                <input
                                  type="hidden"
                                  name="id"
                                  value={booking.id}
                                />
                                <button
                                  type="submit"
                                  className="btn btn-ghost btn-xs text-error"
                                >
                                  Remove
                                </button>
                              </form>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="alert alert-soft mt-2">
                    <span className="text-sm">
                      No upcoming bookings in the next 7 days.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function VenueManagementFallback() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Venue Management</h1>
      <p className="text-muted-foreground">
        Loading venue management data...
      </p>
    </div>
  );
}

export default function VenueManagementDashboard() {
  return (
    <Suspense fallback={<VenueManagementFallback />}>
      <VenueManagementContent />
    </Suspense>
  );
}
