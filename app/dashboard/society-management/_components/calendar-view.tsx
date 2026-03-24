"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TeamScheduleItem } from "@/lib/teams";

type TeamOption = {
  id: string;
  name: string;
  sport: string;
};

export function CalendarView(props: {
  teams: TeamOption[];
  scheduleByTeamId: Record<string, TeamScheduleItem[]>;
}) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 23)); // March 23, 2026
  const [selectedTeamId, setSelectedTeamId] = useState(props.teams[0]?.id ?? "");

  const selectedTeam = props.teams.find((t) => t.id === selectedTeamId);
  const scheduleItems = props.scheduleByTeamId[selectedTeamId] ?? [];

  // Get all days in the current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingWeekday = firstDay.getDay();

  // Build a map of dates to events
  const eventsByDate: Record<string, TeamScheduleItem[]> = {};
  scheduleItems.forEach((item) => {
    if (item.event?.event_date) {
      // Normalize datetime values to a day key (YYYY-MM-DD) so calendar cells match.
      const dateKey = item.event.event_date.split("T")[0];
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = [];
      }
      eventsByDate[dateKey].push(item);
    }
  });

  // Generate calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingWeekday; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthName = new Date(year, month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  const getDateString = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;
  };

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Schedule Calendar</h2>
        <p className="text-sm text-muted-foreground">
          View team schedules in calendar format.
        </p>
      </div>

      {props.teams.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Create a team first to see schedules.
        </p>
      ) : (
        <div className="space-y-4">
          {/* Team Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Team</label>
            <select
              value={selectedTeamId}
              onChange={(e) => {
                setSelectedTeamId(e.target.value);
                setSelectedDate(null);
              }}
              className="w-full max-w-xs h-10 rounded-md border border-base-300 bg-base-100 px-3 text-sm"
            >
              {props.teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Calendar Header */}
          <div className="flex items-center justify-between bg-base-200/50 rounded-lg p-4">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-base-300 rounded-md"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-center flex-1">
              {monthName}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-base-300 rounded-md"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Weekday Headers */}
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-sm py-2 bg-base-200/30 rounded-md"
              >
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day, idx) => {
              const dateStr = day ? getDateString(day) : null;
              const dayEvents = dateStr ? eventsByDate[dateStr] ?? [] : [];
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={idx}
                  onClick={() => dateStr && setSelectedDate(isSelected ? null : dateStr)}
                  className={`min-h-24 rounded-md border p-2 cursor-pointer transition ${
                    day === null
                      ? "bg-base-200/20"
                      : isSelected
                        ? "border-primary bg-primary/10 border-2"
                        : dayEvents.length > 0
                          ? "border-warning bg-warning/5"
                          : "border-base-300 bg-base-100 hover:bg-base-200/50"
                  }`}
                >
                  {day && (
                    <div className="space-y-1">
                      <div className="font-semibold text-sm">{day}</div>
                      {dayEvents.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-warning">
                            {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
                          </div>
                          <div className="space-y-0.5">
                            {dayEvents.slice(0, 2).map((item) => (
                              <div
                                key={item.id}
                                className="text-xs bg-warning/20 text-warning-content px-1.5 py-0.5 rounded truncate"
                              >
                                {item.event?.name}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-xs text-muted-foreground px-1.5">
                                +{dayEvents.length - 2} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Event Details for Selected Date */}
          {selectedDate && eventsByDate[selectedDate] && (
            <div className="bg-base-200/30 rounded-lg p-6 space-y-4">
              <div>
                <h4 className="text-lg font-semibold mb-4">
                  Events on {new Date(selectedDate).toLocaleDateString("default", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </h4>

                {eventsByDate[selectedDate].length > 0 ? (
                  <div className="space-y-4">
                    {eventsByDate[selectedDate].map((item) => (
                      <div
                        key={item.id}
                        className="bg-base-100 rounded-lg p-4 border border-base-300 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-semibold text-base">
                              {item.event?.name}
                            </h5>
                            <p className="text-sm text-muted-foreground">
                              {selectedTeam?.name} • {selectedTeam?.sport}
                            </p>
                          </div>
                          <span className="inline-flex rounded-full bg-success/20 px-2 py-1 text-xs font-semibold text-success capitalize">
                            {item.event?.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Date</p>
                            <p className="font-medium">
                              {new Date(selectedDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Venue</p>
                            <p className="font-medium">
                              {item.event?.venue || "Not specified"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Sport Type</p>
                            <p className="font-medium">
                              {item.event?.sport_type || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Event ID</p>
                            <p className="font-medium text-xs">
                              {item.event?.id?.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No events on this date.</p>
                )}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-sky-100/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total Scheduled</p>
              <p className="text-3xl font-bold text-sky-700">{scheduleItems.length}</p>
            </div>
            <div className="bg-emerald-100/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Planned</p>
              <p className="text-3xl font-bold text-emerald-700">
                {scheduleItems.filter((s) => s.event?.status === "planned").length}
              </p>
            </div>
            <div className="bg-amber-100/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-3xl font-bold text-amber-700">
                {scheduleItems.filter((s) => s.event?.status === "completed").length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
