import { Users } from "lucide-react";
import { asSingle } from "./as-single";

type StudentEmbed = {
  id: string;
  student_id: string | null;
  full_name: string | null;
  faculty: string | null;
  batch: string | null;
} | null;

export type PlayerProfileRow = {
  id: string;
  sport: string;
  position: string | null;
  jersey_no: number | null;
  team_name: string | null;
  contact_no: string | null;
  created_at: string | null;
  students: StudentEmbed | StudentEmbed[] | null;
};

type Props = {
  players: PlayerProfileRow[] | null | undefined;
};

export function PlayerProfilesSection({ players }: Props) {
  const list = players ?? [];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-base-100 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-700/80 dark:ring-slate-700/50">
      <div
        className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500"
        aria-hidden
      />
      <div className="space-y-5 p-5 sm:p-7">
        <header className="space-y-1 border-b border-slate-200/80 pb-4 dark:border-slate-700/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Directory
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">
                  Player profiles
                </h2>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-200"
                  title="Total players"
                >
                  <Users className="size-3.5 opacity-80" aria-hidden />
                  {list.length} {list.length === 1 ? "player" : "players"}
                </span>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-base-content/65">
                Overview of everyone registered through this dashboard. Use the
                table below to review or cross-check details.
              </p>
            </div>
          </div>
        </header>

        {list.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-inner dark:border-slate-600/60">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/90 bg-blue-50/95 dark:border-slate-600 dark:bg-blue-950/45">
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-blue-900 dark:text-blue-100">
                    Student
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-blue-900 dark:text-blue-100">
                    Student ID
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-blue-900 dark:text-blue-100">
                    Faculty / Batch
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-blue-900 dark:text-blue-100">
                    Sport
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-blue-900 dark:text-blue-100">
                    Team
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-blue-900 dark:text-blue-100">
                    Position
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-blue-900 dark:text-blue-100">
                    Jersey
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-blue-900 dark:text-blue-100">
                    Contact
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-base-100 dark:divide-slate-800">
                {list.map((player) => {
                  const student = asSingle(player.students);
                  return (
                    <tr
                      key={player.id}
                      className="transition-colors hover:bg-blue-50/60 dark:hover:bg-blue-950/25"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-base-content">
                        {student?.full_name ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-sm tabular-nums text-base-content/90">
                        {student?.student_id ?? "—"}
                      </td>
                      <td className="max-w-[14rem] min-w-[10rem] px-4 py-3 text-base-content/90">
                        {student?.faculty ?? "—"}
                        {student?.batch ? (
                          <span className="text-base-content/60">
                            {" "}
                            / {student.batch}
                          </span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-base-content">
                        {player.sport}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-base-content/90">
                        {player.team_name ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-base-content/90">
                        {player.position ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center font-mono tabular-nums text-base-content/90">
                        {player.jersey_no ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-sm tabular-nums text-base-content/90">
                        {player.contact_no ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center dark:border-slate-600 dark:bg-base-200/40">
            <Users
              className="mx-auto mb-3 size-10 text-blue-400/80 dark:text-blue-500/70"
              aria-hidden
            />
            <p className="text-sm font-medium text-base-content">No players yet</p>
            <p className="mt-1 text-sm text-base-content/60">
              Open <strong>Create player</strong> in the sidebar to add your first
              profile.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
