"use client";

import { useState } from "react";
import {
  deleteTeamAction,
  registerTeamAction,
  updateTeamStatusAction,
} from "../actions";

type Team = {
  id: string;
  name: string;
  sport: string;
  status: string;
};

type Society = {
  id: string;
  name: string;
};

export function TeamsTab(props: { societies: Society[]; teams: Team[] }) {
  const [teamName, setTeamName] = useState("");
  const [teamSport, setTeamSport] = useState("");
  const [formError, setFormError] = useState("");

  const teamsForSelectedSociety = props.teams.filter((t) => t.status === "active");
  const inactiveTeams = props.teams.filter((t) => t.status === "inactive");

  const validateTeamForm = () => {
    setFormError("");
    
    if (!teamName.trim()) {
      setFormError("Team name is required");
      return false;
    }
    
    if (teamName.trim().length < 2) {
      setFormError("Team name must be at least 2 characters");
      return false;
    }
    
    if (!teamSport.trim()) {
      setFormError("Sport is required");
      return false;
    }
    
    // Check for duplicate team names
    if (teamsForSelectedSociety.some((t) => t.name.toLowerCase() === teamName.trim().toLowerCase())) {
      setFormError(`Team "${teamName}" already exists`);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (formData: FormData) => {
    if (!validateTeamForm()) {
      return;
    }
    
    try {
      await registerTeamAction(formData);
      setTeamName("");
      setTeamSport("");
      setFormError("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to register team");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Teams</h2>
          <p className="text-sm text-muted-foreground">
            Register new teams and manage existing ones.
          </p>
        </div>
        {props.societies.length > 0 && (
          <form
            action={handleSubmit}
            className="flex flex-col gap-2"
          >
            {formError && (
              <div className="rounded bg-error/20 px-3 py-2 text-sm text-error">
                {formError}
              </div>
            )}
            <div className="flex items-center gap-2">
              <select
                name="societyId"
                defaultValue={props.societies[0]?.id ?? ""}
                className="h-10 rounded-md border border-base-300 bg-base-100 px-3 text-sm"
              >
                {props.societies.map((society) => (
                  <option key={society.id} value={society.id}>
                    {society.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="name"
                placeholder="Team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="h-10 rounded-md border border-base-300 bg-base-100 px-3 text-sm"
                required
                minLength={2}
              />
              <input
                type="text"
                name="sport"
                placeholder="Sport"
                value={teamSport}
                onChange={(e) => setTeamSport(e.target.value)}
                className="h-10 rounded-md border border-base-300 bg-base-100 px-3 text-sm"
                required
              />
              <button
                type="submit"
                className="h-10 rounded-md bg-neutral px-4 text-sm font-semibold text-neutral-content hover:bg-neutral/80"
              >
                Register Team
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="overflow-x-auto rounded border bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-2 font-medium">Team</th>
              <th className="px-4 py-2 font-medium">Sport</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teamsForSelectedSociety.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  No active teams yet. Create the first team using the form above.
                </td>
              </tr>
            ) : (
              teamsForSelectedSociety.map((team) => (
                <tr key={team.id} className="border-t">
                  <td className="px-4 py-2">{team.name}</td>
                  <td className="px-4 py-2">{team.sport}</td>
                  <td className="px-4 py-2">
                    <form action={updateTeamStatusAction}>
                      <input type="hidden" name="teamId" value={team.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={
                          team.status === "active" ? "inactive" : "active"
                        }
                      />
                      <button
                        type="submit"
                        className={
                          team.status === "active"
                            ? "inline-flex rounded-full bg-success/20 px-3 py-1 text-sm font-semibold text-success"
                            : "inline-flex rounded-full bg-warning/20 px-3 py-1 text-sm font-semibold text-warning"
                        }
                      >
                        {team.status === "active" ? "Active" : "Inactive"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-2">
                    <form action={deleteTeamAction}>
                      <input type="hidden" name="teamId" value={team.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-error/50 px-3 py-1 text-sm font-medium text-error"
                      >
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

