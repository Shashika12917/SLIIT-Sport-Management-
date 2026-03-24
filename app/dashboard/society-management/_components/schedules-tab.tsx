"use client";

import { useState } from "react";
import { createTeamEventAndLinkAction, removeTeamScheduleItemAction, updateEventDateTimeAction } from "../actions";
import { Calendar, Clock } from "lucide-react";
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
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

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
                type="time"
                name="eventTime"
                placeholder="Time"
                className="h-10 rounded-md border border-base-300 bg-base-100 px-3 text-sm"
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
                  <th className="px-4 py-2 font-medium">Date & Time</th>
                  <th className="px-4 py-2 font-medium">Venue</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
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
                        {editingEventId === item.event?.id ? (
                          <form
                            action={updateEventDateTimeAction}
                            className="flex gap-2 items-center"
                            onSubmit={() => setEditingEventId(null)}
                          >
                            <input
                              type="hidden"
                              name="eventId"
                              value={item.event?.id ?? ""}
                            />
                            <input
                              type="date"
                              name="eventDate"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="h-8 rounded border border-base-300 px-2 text-sm"
                              required
                            />
                            <input
                              type="time"
                              name="eventTime"
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                              className="h-8 rounded border border-base-300 px-2 text-sm"
                            />
                            <button
                              type="submit"
                              className="h-8 rounded bg-success px-2 text-sm font-medium text-success-content hover:bg-success/80"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingEventId(null)}
                              className="h-8 rounded bg-base-300 px-2 text-sm font-medium hover:bg-base-400"
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <div className="flex items-center gap-2 text-sm">
                            {item.event?.event_date && (
                              <>
                                <Calendar className="w-4 h-4" />
                                {new Date(item.event.event_date).toLocaleDateString()}
                                {item.event.event_date.includes("T") && (
                                  <>
                                    <Clock className="w-4 h-4 ml-2" />
                                    {new Date(item.event.event_date).toLocaleTimeString(
                                      "default",
                                      { hour: "2-digit", minute: "2-digit" }
                                    )}
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {item.event?.venue ?? "-"}
                      </td>
                      <td className="px-4 py-2 capitalize">
                        {item.event?.status ?? "-"}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (item.event?.event_date) {
                                const [datePart, timePart] = item.event.event_date.split("T");
                                setEditDate(datePart ?? "");
                                setEditTime(timePart ? timePart.slice(0, 5) : "");
                                setEditingEventId(item.event.id);
                              }
                            }}
                            className="rounded-md border border-warning/50 px-3 py-1 text-sm font-medium text-warning hover:bg-warning/5"
                          >
                            Edit
                          </button>
                          <form action={removeTeamScheduleItemAction}>
                            <input type="hidden" name="linkId" value={item.id} />
                            <button
                              type="submit"
                              className="rounded-md border border-error/50 px-3 py-1 text-sm font-medium text-error hover:bg-error/5"
                            >
                              Delete
                            </button>
                          </form>
                        </div>
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

