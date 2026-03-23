import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthButton } from "@/components/auth-button";
import Link from "next/link";

async function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-base-100 via-base-200 to-base-100">
      <nav className="navbar bg-base-100 text-base-content shadow-md border-b border-base-300">
        <div className="flex-1 items-center gap-4">
          <Link
            href="/dashboard"
            className="btn btn-ghost px-2 text-lg font-semibold normal-case"
          >
            SLIIT Sports Event Management
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <Link
              href="/dashboard/event-management"
              className="btn btn-ghost btn-sm text-xs"
            >
              Events
            </Link>
            <Link
              href="/dashboard/society-management"
              className="btn btn-ghost btn-sm text-xs"
            >
              Society
            </Link>
            <Link
              href="/dashboard/player-management"
              className="btn btn-ghost btn-sm text-xs"
            >
              Players
            </Link>
            <Link
              href="/dashboard/venue-management"
              className="btn btn-ghost btn-sm text-xs"
            >
              Venues
            </Link>
            <Link
              href="/dashboard/results-management"
              className="btn btn-ghost btn-sm text-xs"
            >
              Results
            </Link>
          </div>
        </div>
        <div className="flex-none">
          <AuthButton />
        </div>
      </nav>

      <div className="flex-1 px-4 py-6 md:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-box bg-base-100 p-4 shadow-md ring-1 ring-base-300/60">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

function DashboardLayoutFallback() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-base-100 via-base-200 to-base-100">
      <nav className="navbar bg-base-100 text-base-content shadow-md border-b border-base-300">
        <div className="flex-1 items-center gap-4">
          <span className="btn btn-ghost px-2 text-lg font-semibold normal-case">
            SLIIT Sports Event Management
          </span>
        </div>
      </nav>
      <div className="flex-1 px-4 py-6 md:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-box bg-base-100 p-4 shadow-md ring-1 ring-base-300/60" />
        </div>
      </div>
    </main>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardLayoutFallback />}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
