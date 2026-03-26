"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarPlus,
  UserPen,
  UserPlus,
  Users,
} from "lucide-react";

export type PlayerManagementSection =
  | "create"
  | "view"
  | "update"
  | "events";

const SECTIONS: PlayerManagementSection[] = [
  "create",
  "view",
  "update",
  "events",
];

const NAV: {
  id: PlayerManagementSection;
  label: string;
  description: string;
  icon: typeof UserPlus;
}[] = [
  {
    id: "create",
    label: "Create player",
    description: "New profile & student link",
    icon: UserPlus,
  },
  {
    id: "view",
    label: "View players",
    description: "Directory & table",
    icon: Users,
  },
  {
    id: "update",
    label: "Update player",
    description: "Team & contact details",
    icon: UserPen,
  },
  {
    id: "events",
    label: "Event registration",
    description: "Register & history",
    icon: CalendarPlus,
  },
];

function parseSection(raw: string | null): PlayerManagementSection {
  if (raw && SECTIONS.includes(raw as PlayerManagementSection)) {
    return raw as PlayerManagementSection;
  }
  return "create";
}

type Props = {
  create: ReactNode;
  view: ReactNode;
  update: ReactNode;
  events: ReactNode;
};

export function PlayerManagementLayout({
  create,
  view,
  update,
  events,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramSection = parseSection(searchParams.get("section"));
  const [section, setSection] =
    useState<PlayerManagementSection>(paramSection);

  useEffect(() => {
    setSection(parseSection(searchParams.get("section")));
  }, [searchParams]);

  const setSectionInUrl = useCallback(
    (next: PlayerManagementSection) => {
      setSection(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set("section", next);
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const panels = useMemo(
    () => ({ create, view, update, events }),
    [create, view, update, events],
  );

  const active = panels[section];

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <aside
        className="shrink-0 lg:w-60 xl:w-64"
        aria-label="Player management sections"
      >
        <nav className="rounded-2xl border border-slate-200/90 bg-base-100 p-2 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-700/80 dark:ring-slate-700/50">
          <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Navigate
          </p>
          <ul className="flex flex-row gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive = section === item.id;
              return (
                <li key={item.id} className="min-w-0 shrink-0 lg:shrink">
                  <button
                    type="button"
                    onClick={() => setSectionInUrl(item.id)}
                    className={
                      isActive
                        ? "flex w-full items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/95 px-3 py-2.5 text-left text-sm transition-colors dark:border-blue-900/50 dark:bg-blue-950/40"
                        : "flex w-full items-start gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-base-content/80 transition-colors hover:border-slate-200/80 hover:bg-slate-50/80 dark:hover:border-slate-600/60 dark:hover:bg-base-200/50"
                    }
                  >
                    <span
                      className={
                        isActive
                          ? "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm dark:bg-blue-500"
                          : "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-base-200 dark:text-base-content/70"
                      }
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <span
                        className={
                          isActive
                            ? "block font-semibold text-blue-900 dark:text-blue-100"
                            : "block font-medium text-base-content"
                        }
                      >
                        {item.label}
                      </span>
                      <span className="mt-0.5 hidden text-xs leading-snug text-base-content/55 sm:block">
                        {item.description}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">{active}</div>
    </div>
  );
}
