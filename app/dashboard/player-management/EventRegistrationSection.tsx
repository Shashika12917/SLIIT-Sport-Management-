import { registerPlayerForEvent } from "./actions";
import { asSingle } from "./as-single";
import type { PlayerProfileRow } from "./PlayerProfilesSection";

type EventRow = {
  id: string;
  name: string;
  sport_type: string;
  event_date: string | null;
};

type RegistrationRow = {
  id: string;
  registration_status: string;
  result: string | null;
  notes: string | null;
  registered_at: string | null;
  players:
    | {
        id: string;
        sport: string;
        students:
          | { student_id: string | null; full_name: string | null }
          | { student_id: string | null; full_name: string | null }[]
          | null;
      }
    | {
        id: string;
        sport: string;
        students:
          | { student_id: string | null; full_name: string | null }
          | { student_id: string | null; full_name: string | null }[]
          | null;
      }[]
    | null;
  events:
    | {
        id: string;
        name: string;
        sport_type: string;
        event_date: string | null;
      }
    | {
        id: string;
        name: string;
        sport_type: string;
        event_date: string | null;
      }[]
    | null;
};

type Props = {
  players: PlayerProfileRow[] | null | undefined;
  events: EventRow[] | null | undefined;
  registrations: RegistrationRow[] | null | undefined;
};

const selectField =
  "select select-bordered select-md w-full rounded-lg border-slate-200 bg-base-100 text-sm transition-[border-color,box-shadow] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 dark:border-slate-600";

export function EventRegistrationSection({
  players,
  events,
  registrations,
}: Props) {
  const regList = registrations ?? [];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-base-100 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-700/80 dark:ring-slate-700/50">
      <div
        className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500"
        aria-hidden
      />
      <div className="space-y-6 p-5 sm:p-7">
        <header className="space-y-2 border-b border-slate-200/80 pb-5 dark:border-slate-700/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Events
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">
            Event registration
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-base-content/65">
            Register a player for an upcoming event and review recent participation
            history.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr),minmax(0,1.4fr)]">
          <section className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 dark:border-slate-700/60 dark:bg-base-200/30">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-200/70 pb-3 dark:border-slate-600/60">
              <span className="h-8 w-1 shrink-0 rounded-full bg-blue-600 dark:bg-blue-500" />
              <div>
                <h3 className="text-sm font-semibold text-base-content">
                  New registration
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-base-content/55">
                  Choose a player and event, then submit.
                </p>
              </div>
            </div>

            <form action={registerPlayerForEvent} className="space-y-4">
              <div className="form-control">
                <label
                  htmlFor="player_id_register"
                  className="label cursor-pointer px-0 pb-1 pt-0"
                >
                  <span className="label-text text-sm font-medium text-base-content">
                    Player
                    <span
                      className="ml-0.5 text-red-500 dark:text-red-400"
                      title="Required"
                    >
                      *
                    </span>
                  </span>
                </label>
                <select
                  id="player_id_register"
                  name="player_id"
                  required
                  className={selectField}
                >
                  <option value="">Select a player</option>
                  {players?.map((player) => {
                    const student = asSingle(player.students);
                    return (
                      <option key={player.id} value={player.id}>
                        {student?.student_id ?? "—"} –{" "}
                        {student?.full_name ?? "Unknown"} ({player.sport})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-control">
                <label
                  htmlFor="event_id_register"
                  className="label cursor-pointer px-0 pb-1 pt-0"
                >
                  <span className="label-text text-sm font-medium text-base-content">
                    Event
                    <span
                      className="ml-0.5 text-red-500 dark:text-red-400"
                      title="Required"
                    >
                      *
                    </span>
                  </span>
                </label>
                <select
                  id="event_id_register"
                  name="event_id"
                  required
                  className={selectField}
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

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-[background-color,box-shadow] hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400 sm:w-auto"
                >
                  Register for event
                </button>
              </div>
            </form>
          </section>

          <section className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3 dark:border-slate-700/80">
              <h3 className="text-sm font-semibold text-base-content">
                Participation history
              </h3>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-base-content/80 dark:border-slate-600 dark:bg-base-200/60">
                {regList.length}{" "}
                {regList.length === 1 ? "entry" : "entries"}
              </span>
            </div>

            {regList.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-inner dark:border-slate-600/60">
                <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/90 bg-blue-50/95 dark:border-slate-600 dark:bg-blue-950/45">
                      <th className="whitespace-nowrap px-3 py-3 font-semibold text-blue-900 dark:text-blue-100">
                        Date
                      </th>
                      <th className="whitespace-nowrap px-3 py-3 font-semibold text-blue-900 dark:text-blue-100">
                        Student
                      </th>
                      <th className="whitespace-nowrap px-3 py-3 font-semibold text-blue-900 dark:text-blue-100">
                        Sport
                      </th>
                      <th className="whitespace-nowrap px-3 py-3 font-semibold text-blue-900 dark:text-blue-100">
                        Event
                      </th>
                      <th className="whitespace-nowrap px-3 py-3 font-semibold text-blue-900 dark:text-blue-100">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-base-100 dark:divide-slate-800">
                    {regList.map((reg) => {
                      const regPlayer = asSingle(reg.players);
                      const regStudent = regPlayer
                        ? asSingle(regPlayer.students)
                        : undefined;
                      const ev = asSingle(reg.events);
                      return (
                        <tr
                          key={reg.id}
                          className="transition-colors hover:bg-blue-50/60 dark:hover:bg-blue-950/25"
                        >
                          <td className="whitespace-nowrap px-3 py-2.5 text-sm text-base-content/90">
                            {reg.registered_at
                              ? new Date(reg.registered_at).toLocaleString()
                              : "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-sm">
                            {regStudent?.student_id ?? "—"} –{" "}
                            {regStudent?.full_name ?? "Unknown"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-sm text-base-content/90">
                            {regPlayer?.sport ?? "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-sm text-base-content/90">
                            {ev
                              ? `${ev.name} (${ev.sport_type})`
                              : "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-sm capitalize">
                            <span className="inline-flex rounded-full border border-slate-200 bg-base-100 px-2 py-0.5 text-xs font-medium dark:border-slate-600">
                              {reg.registration_status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-8 text-center text-sm text-base-content/70 dark:border-slate-600 dark:bg-base-200/40">
                No participation history yet. Register a player for an event to
                start tracking.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
