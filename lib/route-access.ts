import type { HonorSociety, UserRole } from "./database.types";

export type AccessProfile = {
  role: UserRole;
  isTechManager: boolean;
  honorSocieties: string[];
};

export type DenialReason = "signin_required" | "role" | "society";

export type RouteGuard = {
  prefix: string;
  label: string;
  roles: UserRole[];
  allowTechManager?: boolean;
  requireHonorSocietyMember?: boolean;
};

/** Sub-paths of /honor-societies that map to a specific society. */
export const HONOR_SOCIETY_SLUGS: Record<string, HonorSociety> = {
  nhs: "NHS",
  njhs: "NJHS",
  beta: "Beta Club",
  spanish: "Spanish Honor Society",
  science: "Science National Honor Society",
};

// Order matters: the first matching prefix wins, so keep nested routes first.
export const ROUTE_GUARDS: RouteGuard[] = [
  {
    prefix: "/admin/certification",
    label: "Certification Queue",
    roles: ["admin"],
    allowTechManager: true,
  },
  {
    prefix: "/admin/approvals",
    label: "Hour Verification",
    roles: ["teacher", "ta", "admin"],
    allowTechManager: true,
  },
  {
    prefix: "/admin/rosters",
    label: "Master Admin Roster",
    roles: ["admin"],
    allowTechManager: true,
  },
  {
    prefix: "/honor-societies",
    label: "Honor Societies Hub",
    roles: ["student"],
    requireHonorSocietyMember: true,
  },
  {
    prefix: "/admin",
    label: "Admin & Certification Portal",
    roles: ["teacher", "admin"],
    allowTechManager: true,
  },
  {
    prefix: "/teacher-dashboard",
    label: "Teacher / Advisor Dashboard",
    roles: ["teacher", "ta", "admin"],
    allowTechManager: true,
  },
  {
    prefix: "/org-dashboard",
    label: "Outside Org Portal",
    roles: ["outside_org"],
  },
];

export function matchRouteGuard(pathname: string): RouteGuard | null {
  return (
    ROUTE_GUARDS.find(
      (guard) =>
        pathname === guard.prefix || pathname.startsWith(`${guard.prefix}/`),
    ) ?? null
  );
}

/** The society a path targets, e.g. /honor-societies/nhs -> "NHS". */
export function honorSocietyForPath(pathname: string): HonorSociety | null {
  const slug = pathname.split("/")[2]?.toLowerCase();
  return slug ? (HONOR_SOCIETY_SLUGS[slug] ?? null) : null;
}

export function evaluateRouteAccess(
  guard: RouteGuard,
  profile: AccessProfile | null,
  pathname: string,
): DenialReason | null {
  if (!profile) {
    return "signin_required";
  }

  if (guard.allowTechManager && profile.isTechManager) {
    return null;
  }

  if (!guard.roles.includes(profile.role)) {
    return "role";
  }

  if (guard.requireHonorSocietyMember) {
    const society = honorSocietyForPath(pathname);
    if (society) {
      return profile.honorSocieties.includes(society) ? null : "society";
    }
    return profile.honorSocieties.length > 0 ? null : "society";
  }

  return null;
}

export function denialMessage(
  guardLabel: string,
  reason: DenialReason,
  society?: string | null,
): string {
  switch (reason) {
    case "signin_required":
      return `Sign in to open the ${guardLabel}.`;
    case "society":
      return society
        ? `${society} pages are limited to students enrolled in that society.`
        : `The ${guardLabel} is limited to students enrolled in an honor society.`;
    default:
      return `Your current role does not have access to the ${guardLabel}.`;
  }
}
