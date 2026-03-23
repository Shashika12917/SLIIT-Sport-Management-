"use client";

import { createTeamEventAndLinkAction, removeTeamScheduleItemAction } from "../actions";
import type { TeamScheduleItem } from "@/lib/teams";

type TeamOption = {
  id: string;
  name: string;
  sport: string;
};

export function SchedulesTab(props: {
  teams: TeamOption[];
  scheduleByTeamId: Record<string, TeamScheduleItem[]>;
}) {
  const firstTeamId = props.teams[0]?.id ?? "";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Schedules</h2>
        <p className="text-sm text-muted-foreground">
          Manage team practice sessions and fixtures using events.
        </p>
      </div>

      {props.teams.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Create a team first to start scheduling.
        </p>
      ) : (
        <>
          <form action={createTeamEventAndLinkAction} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                name="teamId"
                defaultValue={firstTeamId}
                className="h-10 rounded-md border border-base-300 bg-base-100 px-3 text-sm"
              >
                {props.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="name"
                placeholder="Session / match name"
                className="h-10 rounded-md border border-base-300 bg-base-100 px-3 text-sm"
                required
              />
              <input
                type="date"
                name="eventDate"
                className="h-10 rounded-md border border-base-300 bg-base-100 px-3 text-sm"
                required
              />
              <input
                type="text"
                name="venue"
                placeholder="Venue"
                className="h-10 rounded-md border border-base-300 bg-base-100 px-3 text-sm"
                required
              />
              <input
                type="text"
                name="sportType"
                placeholder="Sport type"
                className="h-10 rounded-md border border-base-300 bg-base-100 px-3 text-sm"
                required
              />
              <button
                type="submit"
                className="h-10 rounded-md bg-neutral px-4 text-sm font-semibold text-neutral-content"
              >
                Add to schedule
              </button>
            </div>
          </form>

          <div className="overflow-x-auto rounded border bg-card">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-2 font-medium">Team</th>
                  <th className="px-4 py-2 font-medium">Event</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Venue</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {props.teams.map((team) => {
                  const items = props.scheduleByTeamId[team.id] ?? [];

                  if (items.length === 0) {
                    return (
                      <tr key={team.id} className="border-t">
                        <td className="px-4 py-2">{team.name}</td>
                        <td
                          colSpan={5}
                          className="px-4 py-2 text-muted-foreground"
                        >
                          No upcoming events.
                        </td>
                      </tr>
                    );
                  }

                  return items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-2">{team.name}</td>
                      <td className="px-4 py-2">
                        {item.event?.name ?? "Unknown"}
                      </td>
                      <td className="px-4 py-2">
                        {item.event?.event_date ?? "-"}
                      </td>
                      <td className="px-4 py-2">
                        {item.event?.venue ?? "-"}
                      </td>
                      <td className="px-4 py-2 capitalize">
                        {item.event?.status ?? "-"}
                      </td>
                      <td className="px-4 py-2">
                        <form action={removeTeamScheduleItemAction}>
                          <input type="hidden" name="linkId" value={item.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-error/50 px-3 py-1 text-sm font-medium text-error"
                          >
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

