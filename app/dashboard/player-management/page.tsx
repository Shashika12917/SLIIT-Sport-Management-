import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createPlayerProfile,
  updatePlayerDetails,
  registerPlayerForEvent,
} from "./actions";
import { StudentIdInput } from "./StudentIdInput";

async function PlayerManagementContent() {
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

  if (profileError || profile?.role !== "player_management") {
    redirect("/dashboard");
  }

  const { data: players } = await supabase
    .from("players")
    .select(
      `
        id,
        sport,
        position,
        jersey_no,
        team_name,
        contact_no,
        created_at,
        students (
          id,
          student_id,
          full_name,
          faculty,
          batch
        )
      `
    )
    .order("created_at", { ascending: true });

  const { data: events } = await supabase
    .from("events")
    .select("id, name, sport_type, event_date")
    .neq("status", "cancelled")
    .order("event_date", { ascending: true });

  const { data: registrations } = await supabase
    .from("player_event_registrations")
    .select(
      `
        id,
        registration_status,
        result,
        notes,
        registered_at,
        players (
          id,
          sport,
          students (
            student_id,
            full_name
          )
        ),
        events (
          id,
          name,
          sport_type,
          event_date
        )
      `
    )
    .order("registered_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Player Management</h1>
        <p className="text-muted-foreground">
          Track student participation, player profiles, and event registrations.
        </p>
      </header>

      {/* Create player profile */}
      <section className="card bg-base-100 shadow-sm border">
        <div className="card-body space-y-6">
          <form action={createPlayerProfile} className="space-y-4">
            <div className="flex flex-col gap-3 border-b border-base-300 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="card-title text-sm font-semibold uppercase tracking-wide text-neutral">
                  New Player Profile
                </h2>
                <p className="text-sm text-base-content/70">
                  Create a player profile linked to a unique student ID.
                </p>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-sm sm:btn-md"
              >
                Create Player
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="form-control">
                <label htmlFor="student_id" className="label py-1">
                  <span className="label-text text-xs font-medium">
                    Student ID
                  </span>
                </label>
                <StudentIdInput />
              </div>

              <div className="form-control">
                <label htmlFor="full_name" className="label py-1">
                  <span className="label-text text-xs font-medium">
                    Full name
                  </span>
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  required
                  type="text"
                  className="input input-sm input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label htmlFor="email" className="label py-1">
                  <span className="label-text text-xs font-medium">Email</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="input input-sm input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label htmlFor="faculty" className="label py-1">
                  <span className="label-text text-xs font-medium">
                    Faculty
                  </span>
                </label>
                <input
                  id="faculty"
                  name="faculty"
                  type="text"
                  className="input input-sm input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label htmlFor="batch" className="label py-1">
                  <span className="label-text text-xs font-medium">Batch</span>
                </label>
                <input
                  id="batch"
                  name="batch"
                  type="text"
                  className="input input-sm input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label htmlFor="sport" className="label py-1">
                  <span className="label-text text-xs font-medium">Sport</span>
                </label>
                <input
                  id="sport"
                  name="sport"
                  required
                  type="text"
                  placeholder="Football"
                  className="input input-sm input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label htmlFor="team_name" className="label py-1">
                  <span className="label-text text-xs font-medium">
                    Team name
                  </span>
                </label>
                <input
                  id="team_name"
                  name="team_name"
                  type="text"
                  className="input input-sm input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label htmlFor="position" className="label py-1">
                  <span className="label-text text-xs font-medium">
                    Position
                  </span>
                </label>
                <input
                  id="position"
                  name="position"
                  type="text"
                  placeholder="Goalkeeper"
                  className="input input-sm input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label htmlFor="jersey_no" className="label py-1">
                  <span className="label-text text-xs font-medium">
                    Jersey number
                  </span>
                </label>
                <input
                  id="jersey_no"
                  name="jersey_no"
                  type="number"
                  min={0}
                  className="input input-sm input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label htmlFor="contact_no" className="label py-1">
                  <span className="label-text text-xs font-medium">
                    Contact number
                  </span>
                </label>
                <input
                  id="contact_no"
                  name="contact_no"
                  type="tel"
                  className="input input-sm input-bordered w-full"
                />
              </div>
            </div>
          </form>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral">
                Player Profiles
              </h2>
              <span className="badge badge-outline badge-sm">
                {players?.length ?? 0}{" "}
                {players && players.length === 1 ? "player" : "players"}
              </span>
            </div>

            {players && players.length > 0 ? (
              <div className="overflow-x-auto rounded-box border border-base-300">
                <table className="table table-zebra-zebra table-sm lg:table-md">
                  <thead className="bg-base-200">
                    <tr className="text-xs uppercase tracking-wide text-base-content/70">
                      <th>Student</th>
                      <th>Student ID</th>
                      <th>Faculty / Batch</th>
                      <th>Sport</th>
                      <th>Team</th>
                      <th>Position</th>
                      <th>Jersey</th>
                      <th>Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player) => (
                      <tr key={player.id}>
                        <td className="whitespace-nowrap text-sm">
                          {player.students?.[0]?.full_name ?? "—"}
                        </td>
                        <td className="whitespace-nowrap text-sm">
                          {player.students?.[0]?.student_id ?? "—"}
                        </td>
                        <td className="whitespace-nowrap text-sm">
                          {player.students?.[0]?.faculty ?? "—"}{" "}
                          {player.students?.[0]?.batch
                            ? ` / ${player.students[0].batch}`
                            : ""}
                        </td>
                        <td className="whitespace-nowrap text-sm">
                          {player.sport}
                        </td>
                        <td className="whitespace-nowrap text-sm">
                          {player.team_name ?? "—"}
                        </td>
                        <td className="whitespace-nowrap text-sm">
                          {player.position ?? "—"}
                        </td>
                        <td className="whitespace-nowrap text-sm">
                          {player.jersey_no ?? "—"}
                        </td>
                        <td className="whitespace-nowrap text-sm">
                          {player.contact_no ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info mt-2">
                <span className="text-sm">
                  No players yet. Use the form above to add your first player.
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Update player details */}
      <section className="card bg-base-100 shadow-sm border">
        <div className="card-body space-y-4">
          <form action={updatePlayerDetails} className="space-y-4">
            <div className="flex flex-col gap-3 border-b border-base-300 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="card-title text-sm font-semibold uppercase tracking-wide text-neutral">
                  Update Player Details
                </h2>
                <p className="text-sm text-base-content/70">
                  Adjust team, position, jersey number, or contact information.
                </p>
              </div>

              <button
                type="submit"
                className="btn btn-outline btn-sm sm:btn-md"
              >
                Save Changes
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="form-control sm:col-span-2 lg:col-span-2">
                <label htmlFor="player_id" className="label py-1">
                  <span className="label-text text-xs font-medium">
                    Player
                  </span>
                </label>
                <select
                  id="player_id"
                  name="player_id"
                  required
                  className="select select-sm select-bordered w-full"
                >
                  <option value="">Select a player</option>
                  {players?.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.students?.[0]?.student_id ?? "—"} –{" "}
                      {player.students?.[0]?.full_name ?? "Unknown"} (
                        {player.sport}
                      )
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label htmlFor="team_name_update" className="label py-1">
                  <span className="label-text text-xs font-medium">
                    Team name
                  </span>
                </label>
                <input
                  id="team_name_update"
                  name="team_name"
                  type="text"
                  className="input input-sm input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label htmlFor="position_update" className="label py-1">
                  <span className="label-text text-xs font-medium">
                    Position
                  </span>
                </label>
                <input
                  id="position_update"
                  name="position"
                  type="text"
                  className="input input-sm input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label htmlFor="jersey_no_update" className="label py-1">
                  <span className="label-text text-xs font-medium">
                    Jersey number
                  </span>
                </label>
                <input
                  id="jersey_no_update"
                  name="jersey_no"
                  type="number"
                  min={0}
                  className="input input-sm input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label htmlFor="contact_no_update" className="label py-1">
                  <span className="label-text text-xs font-medium">
                    Contact number
                  </span>
                </label>
                <input
                  id="contact_no_update"
                  name="contact_no"
                  type="tel"
                  className="input input-sm input-bordered w-full"
                />
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Event registration & participation history */}
      <section className="card bg-base-100 shadow-sm border">
        <div className="card-body space-y-6">
          <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
            <form action={registerPlayerForEvent} className="space-y-4">
              <div className="flex flex-col gap-3 border-b border-base-300 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="card-title text-sm font-semibold uppercase tracking-wide text-neutral">
                    Event Registration
                  </h2>
                  <p className="text-sm text-base-content/70">
                    Register a player for an upcoming event.
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm sm:btn-md"
                >
                  Register
                </button>
              </div>

              <div className="space-y-4">
                <div className="form-control">
                  <label htmlFor="player_id_register" className="label py-1">
                    <span className="label-text text-xs font-medium">
                      Player
                    </span>
                  </label>
                  <select
                    id="player_id_register"
                    name="player_id"
                    required
                    className="select select-sm select-bordered w-full"
                  >
                    <option value="">Select a player</option>
                    {players?.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.students?.[0]?.student_id ?? "—"} –{" "}
                        {player.students?.[0]?.full_name ?? "Unknown"} (
                          {player.sport}
                        )
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label htmlFor="event_id_register" className="label py-1">
                    <span className="label-text text-xs font-medium">
                      Event
                    </span>
                  </label>
                  <select
                    id="event_id_register"
                    name="event_id"
                    required
                    className="select select-sm select-bordered w-full"
                  >
                    <option value="">Select an event</option>
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
              </div>
            </form>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral">
                  Participation History
                </h2>
                <span className="badge badge-outline badge-sm">
                  {registrations?.length ?? 0}{" "}
                  {registrations && registrations.length === 1
                    ? "entry"
                    : "entries"}
                </span>
              </div>

              {registrations && registrations.length > 0 ? (
                <div className="overflow-x-auto rounded-box border border-base-300">
                  <table className="table table-zebra-zebra table-sm lg:table-md">
                    <thead className="bg-base-200">
                      <tr className="text-xs uppercase tracking-wide text-base-content/70">
                        <th>Date</th>
                        <th>Student</th>
                        <th>Sport</th>
                        <th>Event</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map((reg) => (
                        <tr key={reg.id}>
                          <td className="whitespace-nowrap text-sm">
                            {reg.registered_at
                              ? new Date(reg.registered_at).toLocaleString()
                              : "—"}
                          </td>
                          <td className="whitespace-nowrap text-sm">
                            {reg.players?.[0]?.students?.[0]?.student_id ?? "—"}{" "}
                            –{" "}
                            {reg.players?.[0]?.students?.[0]?.full_name ??
                              "Unknown"}
                          </td>
                          <td className="whitespace-nowrap text-sm">
                            {reg.players?.[0]?.sport ?? "—"}
                          </td>
                          <td className="whitespace-nowrap text-sm">
                            {reg.events && reg.events.length > 0
                              ? `${reg.events[0].name} (${reg.events[0].sport_type})`
                              : "—"}
                          </td>
                          <td className="whitespace-nowrap text-sm capitalize">
                            <span className="badge badge-sm badge-outline">
                              {reg.registration_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-info mt-2">
                  <span className="text-sm">
                    No participation history yet. Register a player for an
                    event to start tracking.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function PlayerManagementFallback() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Player Management</h1>
      <p className="text-muted-foreground">
        Loading player management data...
      </p>
    </div>
  );
}

export default function PlayerManagementDashboard() {
  return (
    <Suspense fallback={<PlayerManagementFallback />}>
      <PlayerManagementContent />
    </Suspense>
  );
}

