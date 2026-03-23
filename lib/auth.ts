/**
 * Role values stored in public.profiles (must match DB enum user_role).
 * Dashboard path uses hyphenated slugs for URLs.
 */
export const ROLES = [
  "event_management",
  "society_management",
  "player_management",
  "venue_management",
  "results_management",
] as const;

export type UserRole = (typeof ROLES)[number];

const ROLE_TO_DASHBOARD: Record<UserRole, string> = {
  event_management: "/dashboard/event-management",
  society_management: "/dashboard/society-management",
  player_management: "/dashboard/player-management",
  venue_management: "/dashboard/venue-management",
  results_management: "/dashboard/results-management",
};

export function getDashboardPathForRole(role: string): string {
  const path = ROLE_TO_DASHBOARD[role as UserRole];
  return path ?? "/dashboard";
}

export function isValidRole(role: string): role is UserRole {
  return ROLES.includes(role as UserRole);
}
