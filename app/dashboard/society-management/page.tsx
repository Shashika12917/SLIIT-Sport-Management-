import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSocietiesForUser, getTeamsForSociety, getTeamSchedule, type TeamScheduleItem } from "@/lib/teams";
import { SocietiesSection } from "./_components/societies-section";
import { TeamsTab } from "./_components/teams-tab";
import { SchedulesTab } from "./_components/schedules-tab";
import { CalendarView } from "./_components/calendar-view";
import { MembersTab } from "./_components/members-tab";
import { ShieldCheck, Trophy, Users } from "lucide-react";

type SocietyRow = {
  id: string;
  name: string;
  description: string | null;
  status: string;
};

type TeamRow = {
  id: string;
  name: string;
  sport: string;
  status: string;
};

type MemberRow = {
  id: string;
  role: string | null;
  is_active: boolean;
  player: {
    id: string;
    sport: string;
    position: string | null;
    jersey_no: number | null;
    student: {
      id: string;
      student_id: string;
      full_name: string;
      email: string | null;
      faculty: string | null;
      batch: string | null;
    } | null;
  } | null;
  team: {
    id: string;
    name: string;
  } | null;
};

export default async function SocietyManagementDashboard() {
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

  if (profileError || profile?.role !== "society_management") {
    redirect("/dashboard");
  }

  let societies: SocietyRow[] = [];
  try {
    societies = (await getSocietiesForUser(user.id)) as SocietyRow[];
  } catch (error) {
    console.error("Error fetching societies:", error);
  }

  let teams: TeamRow[] = [];
  try {
    const allTeams = (await Promise.all(
      societies.map((society) => getTeamsForSociety(society.id, true)),
    )) as TeamRow[][];
    teams = allTeams.flat();
  } catch (error) {
    console.error("Error fetching teams:", error);
  }

  const scheduleByTeamId: Record<string, TeamScheduleItem[]> = {};
  try {
    const scheduleEntries: { teamId: string; schedule: TeamScheduleItem[] }[] =
      await Promise.all(
        teams.map(async (team) => {
          try {
            const schedule = await getTeamSchedule(team.id);
            return { teamId: team.id, schedule };
          } catch (error) {
            console.error(`Error fetching schedule for team ${team.id}:`, error);
            return { teamId: team.id, schedule: [] };
          }
        }),
      );

    for (const entry of scheduleEntries) {
      scheduleByTeamId[entry.teamId] = entry.schedule;
    }
  } catch (error) {
    console.error("Error fetching schedules:", error);
  }

  const { data: membersData, error: membersError } = await supabase
    .from("team_members")
    .select(
      `
        id,
        role,
        is_active,
        player:players (
          id,
          sport,
          position,
          jersey_no,
          student:students (
            id,
            student_id,
            full_name,
            email,
            faculty,
            batch
          )
        ),
        team:teams (
          id,
          name
        )
      `,
    )
    .eq("is_active", true);

  const { count: totalPlayers } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true });

  if (membersError) {
    console.error("Error fetching team members:", membersError);
  }

  const rawMembers = (membersData ?? []) as {
    id: string | number;
    role: string | null;
    is_active: boolean;
    player:
      | {
          id: string | number;
          sport: string;
          position: string | null;
          jersey_no: number | null;
          student:
            | {
                id: string | number;
                student_id: string;
                full_name: string;
                email: string | null;
                faculty: string | null;
                batch: string | null;
              }
            | {
                id: string | number;
                student_id: string;
                full_name: string;
                email: string | null;
                faculty: string | null;
                batch: string | null;
              }[]
            | null;
        }
      | {
          id: string | number;
          sport: string;
          position: string | null;
          jersey_no: number | null;
          student:
            | {
                id: string | number;
                student_id: string;
                full_name: string;
                email: string | null;
                faculty: string | null;
                batch: string | null;
              }
            | {
                id: string | number;
                student_id: string;
                full_name: string;
                email: string | null;
                faculty: string | null;
                batch: string | null;
              }[]
            | null;
        }[]
      | null;
    team:
      | {
          id: string | number;
          name: string;
        }
      | {
          id: string | number;
          name: string;
        }[]
      | null;
  }[];

  const members: MemberRow[] = rawMembers.map((row) => {
    const playerValue = row.player;
    const rawPlayer = Array.isArray(playerValue) ? playerValue[0] : playerValue;

    const teamValue = row.team;
    const rawTeam = Array.isArray(teamValue) ? teamValue[0] : teamValue;

    const studentValue = rawPlayer?.student ?? null;
    const rawStudent = Array.isArray(studentValue) ? studentValue[0] : studentValue;

    return {
      id: String(row.id),
      role: row.role,
      is_active: row.is_active,
      player: rawPlayer
        ? {
            id: String(rawPlayer.id),
            sport: rawPlayer.sport,
            position: rawPlayer.position,
            jersey_no: rawPlayer.jersey_no,
            student: rawStudent
              ? {
                  id: String(rawStudent.id),
                  student_id: rawStudent.student_id,
                  full_name: rawStudent.full_name,
                  email: rawStudent.email,
                  faculty: rawStudent.faculty,
                  batch: rawStudent.batch,
                }
              : null,
          }
        : null,
      team: rawTeam
        ? {
            id: String(rawTeam.id),
            name: rawTeam.name,
          }
        : null,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Society Management</h1>
        <p className="text-muted-foreground">
          Manage sports teams, members, and schedules.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-3xl font-semibold leading-tight">Overview</h2>
          <p className="text-sm text-muted-foreground">
            Snapshot of current society-management activity.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-sky-200/60 bg-sky-100/50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">Total Societies</p>
              <ShieldCheck className="h-4 w-4 text-slate-500" />
            </div>
            <p className="text-4xl font-bold text-slate-900">{societies.length}</p>
            <p className="mt-2 text-sm text-slate-500">Societies currently managed</p>
          </div>

          <div className="rounded-xl border border-emerald-200/70 bg-emerald-100/40 p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">Total Teams</p>
              <Trophy className="h-4 w-4 text-slate-500" />
            </div>
            <p className="text-4xl font-bold text-slate-900">
              {teams.filter((team) => team.status === "active").length}
            </p>
            <p className="mt-2 text-sm text-slate-500">Active teams across societies</p>
          </div>

          <div className="rounded-xl border border-amber-200/80 bg-amber-100/35 p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">Total Players</p>
              <Users className="h-4 w-4 text-slate-500" />
            </div>
            <p className="text-4xl font-bold text-slate-900">{totalPlayers ?? 0}</p>
            <p className="mt-2 text-sm text-slate-500">Registered players in the system</p>
          </div>
        </div>
      </section>

      <div className="space-y-10">
        <SocietiesSection societies={societies} />
        <TeamsTab societies={societies} teams={teams} />
        <SchedulesTab
          teams={teams}
          scheduleByTeamId={scheduleByTeamId}
        />
        <CalendarView
          teams={teams.filter((t) => t.status === "active")}
          scheduleByTeamId={scheduleByTeamId}
        />
        <MembersTab members={members} />
      </div>
    </div>
  );
}
