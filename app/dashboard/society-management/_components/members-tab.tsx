"use client";

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

export function MembersTab(props: { members: MemberRow[] }) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Members</h2>
        <p className="text-sm text-muted-foreground">
          Overview of players and their team assignments.
        </p>
      </div>

      <div className="overflow-x-auto rounded border bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-2 font-medium">Player</th>
              <th className="px-4 py-2 font-medium">Student ID</th>
              <th className="px-4 py-2 font-medium">Team</th>
              <th className="px-4 py-2 font-medium">Sport</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {props.members.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  No team memberships yet.
                </td>
              </tr>
            ) : (
              props.members.map((member) => {
                const student = member.player?.student;
                return (
                  <tr key={member.id} className="border-t">
                    <td className="px-4 py-2">
                      {student?.full_name ?? "Unknown"}
                    </td>
                    <td className="px-4 py-2">
                      {student?.student_id ?? "-"}
                    </td>
                    <td className="px-4 py-2">{member.team?.name ?? "-"}</td>
                    <td className="px-4 py-2">
                      {member.player?.sport ?? "-"}
                    </td>
                    <td className="px-4 py-2 capitalize">
                      {member.role ?? "member"}
                    </td>
                    <td className="px-4 py-2">
                      {member.is_active ? "Active" : "Inactive"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

