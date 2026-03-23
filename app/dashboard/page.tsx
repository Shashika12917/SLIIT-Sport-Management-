import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardPathForRole } from "@/lib/auth";

export default async function DashboardPage() {
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

  if (profileError || profile?.role) {
    if (!profileError && profile?.role) {
      redirect(getDashboardPathForRole(profile.role));
    }
  }

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <h1 className="text-xl font-semibold mb-2">No role assigned</h1>
      <p className="text-muted-foreground text-sm">
        Your account does not have a role yet. Please contact an administrator
        to assign you a role.
      </p>
    </div>
  );
}
