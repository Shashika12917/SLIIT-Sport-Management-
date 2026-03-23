import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createEvent, cancelEvent } from "./actions";

async function EventManagementContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "event_management") {
    redirect("/dashboard");
  }

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .neq("status", "cancelled")
    .order("event_date", { ascending: true });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Event Management</h1>
        <p className="text-muted-foreground">
          Manage sports events, schedules, and registrations.
        </p>
      </header>

      <section className="card bg-base-100 shadow-sm border">
        <div className="card-body space-y-6">
          <form action={createEvent} className="space-y-4">
            <div className="flex flex-col gap-3 border-b border-base-300 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="card-title text-sm font-semibold uppercase tracking-wide text-neutral">
                  New Event
                </h2>
                <p className="text-sm text-base-content/70">
                  Add an internal sports event with a date, venue, and sport
                  type.
                </p>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-sm sm:btn-md"
              >
                Create Event
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="form-control">
                <label htmlFor="name" className="label py-1">
                  <span className="label-text text-xs font-medium">
                    Event name
                  </span>
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  type="text"
                  placeholder="Inter-faculty football"
                  className="input input-sm input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label htmlFor="event_date" className="label py-1">
                  <span className="label-text text-xs font-medium">Date</span>
                </label>
                <input
                  id="event_date"
                  name="event_date"
                  type="date"
                  required
                  className="input input-sm input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label htmlFor="venue" className="label py-1">
                  <span className="label-text text-xs font-medium">Venue</span>
                </label>
                <input
                  id="venue"
                  name="venue"
                  required
                  type="text"
                  placeholder="Main ground"
                  className="input input-sm input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label htmlFor="sport_type" className="label py-1">
                  <span className="label-text text-xs font-medium">
                    Sport type
                  </span>
                </label>
                <input
                  id="sport_type"
                  name="sport_type"
                  required
                  type="text"
                  placeholder="Football"
                  className="input input-sm input-bordered w-full"
                />
              </div>
            </div>
          </form>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral">
                Upcoming events
              </h2>
              <span className="badge badge-outline badge-sm">
                {events?.length ?? 0}{" "}
                {events && events.length === 1 ? "event" : "events"}
              </span>
            </div>

            {events && events.length > 0 ? (
              <div className="overflow-x-auto rounded-box border border-base-300">
                <table className="table table-zebra-zebra table-sm lg:table-md">
                  <thead className="bg-base-200">
                    <tr className="text-xs uppercase tracking-wide text-base-content/70">
                      <th>Name</th>
                      <th>Date</th>
                      <th>Venue</th>
                      <th>Sport</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id}>
                        <td className="whitespace-nowrap text-sm">
                          {event.name}
                        </td>
                        <td className="whitespace-nowrap text-sm">
                          {event.event_date
                            ? new Date(event.event_date).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="whitespace-nowrap text-sm">
                          {event.venue}
                        </td>
                        <td className="whitespace-nowrap text-sm">
                          {event.sport_type}
                        </td>
                        <td className="whitespace-nowrap text-sm capitalize">
                          <span
                            className={
                              event.status === "cancelled"
                                ? "badge badge-sm badge-outline border-error text-error"
                                : "badge badge-sm badge-outline border-primary text-primary"
                            }
                          >
                            {event.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap text-right">
                          {event.status !== "cancelled" ? (
                            <form action={cancelEvent} className="inline">
                              <input
                                type="hidden"
                                name="id"
                                value={event.id}
                              />
                              <button
                                type="submit"
                                className="btn btn-ghost btn-xs text-error"
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <span className="text-xs text-base-content/50">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info mt-2">
                <span className="text-sm">
                  No events yet. Use the form above to add your first event.
                </span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function EventManagementFallback() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Event Management</h1>
      <p className="text-muted-foreground">Loading event management data...</p>
    </div>
  );
}

export default function EventManagementDashboard() {
  return (
    <Suspense fallback={<EventManagementFallback />}>
      <EventManagementContent />
    </Suspense>
  );
}
