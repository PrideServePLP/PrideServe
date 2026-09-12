import type { UserRole } from "./database.types";

export const SCHOOL_EMAIL_DOMAIN = "pinelakeprep.org";

export const SCHOOL_ROLES: UserRole[] = [
  "student",
  "ta",
  "teacher",
  "admin",
];

export const AUTH_ROLES: { value: UserRole; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "ta", label: "TA" },
  { value: "admin", label: "Admin" },
  { value: "outside_org", label: "Outside Organization" },
];

export const ONBOARDING_ROLES: { value: UserRole; label: string; description: string }[] =
  [
    {
      value: "student",
      label: "Student",
      description: "Sign up for tasks and log service hours",
    },
    {
      value: "teacher",
      label: "Teacher",
      description: "Post opportunities and verify hours",
    },
    {
      value: "ta",
      label: "TA",
      description: "Support classes and tutoring requests",
    },
    {
      value: "outside_org",
      label: "Outside Organization",
      description: "Submit community service opportunities",
    },
  ];

export const SCHOOL_DOMAIN_ERROR =
  "School roles (student, teacher, TA, and admin) must use an email that ends with @pinelakeprep.org.";

export const INTENDED_ROLE_COOKIE = "prideserve-intended-role";

export function isSchoolEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  return email.trim().toLowerCase().endsWith(`@${SCHOOL_EMAIL_DOMAIN}`);
}

export function isSchoolRole(role: UserRole): boolean {
  return SCHOOL_ROLES.includes(role);
}

export function getDomainErrorForRole(
  email: string,
  role: UserRole,
): string | null {
  if (isSchoolRole(role) && !isSchoolEmail(email)) {
    return SCHOOL_DOMAIN_ERROR;
  }
  return null;
}

export function setIntendedRoleCookie(role: UserRole) {
  document.cookie = `${INTENDED_ROLE_COOKIE}=${role}; Path=/; Max-Age=600; SameSite=Lax`;
}

export function clearIntendedRoleCookie() {
  document.cookie = `${INTENDED_ROLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
