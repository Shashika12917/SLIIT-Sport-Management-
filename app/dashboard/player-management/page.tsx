import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreatePlayerForm } from "./CreatePlayerForm";
import { EventRegistrationSection } from "./EventRegistrationSection";
import { PlayerManagementLayout } from "./PlayerManagementLayout";
import { PlayerProfilesSection } from "./PlayerProfilesSection";
import { UpdatePlayerDetailsForm } from "./UpdatePlayerDetailsForm";
import { asSingle } from "./as-single";

async function PlayerManagementContent() {
  noStore();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "player_management") {
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
      `,
    )
    .order("created_at", { ascending: true });

  const { data: events } = await supabase
    .from("events")
    .select("id, name, sport_type, event_date")
    .order("event_date", { ascending: true });

  const updateFormPlayers =
    players?.map((player) => {
      const student = asSingle(player.students);
      return {
        id: player.id,
        team_name: player.team_name,
        position: player.position,
        jersey_no: player.jersey_no,
        contact_no: player.contact_no,
        label: `${student?.student_id ?? "—"} – ${student?.full_name ?? "Unknown"} (${player.sport})`,
      };
    }) ?? [];

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
      `,
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

      <Suspense
        fallback={
          <div
            className="h-40 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100/80 dark:border-slate-700 dark:bg-base-200/60"
            aria-hidden
          />
        }
      >
        <PlayerManagementLayout
          create={<CreatePlayerForm />}
          view={<PlayerProfilesSection players={players} />}
          update={<UpdatePlayerDetailsForm players={updateFormPlayers} />}
          events={
            <EventRegistrationSection
              players={players ?? undefined}
              events={events ?? undefined}
              registrations={registrations ?? undefined}
            />
          }
        />
      </Suspense>
    </div>
  );
}

function PlayerManagementFallback() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Player Management</h1>
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
