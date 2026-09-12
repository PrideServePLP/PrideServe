import type { HonorSociety, UserRole, UserRow } from "./database.types";
import type { AccessProfile } from "./route-access";

export const DEV_ROLE_COOKIE = "prideserve-dev-role";

export type DevPersonaId =
  | "student_nhs_beta"
  | "teacher_advisor"
  | "outside_org"
  | "tech_manager";

export type DevPersona = {
  id: DevPersonaId;
  label: string;
  fullName: string;
  email: string;
  role: UserRole;
  isTechManager: boolean;
  honorSocieties: HonorSociety[];
  gradeLevel: string | null;
  classes: string[];
};

export const DEV_PERSONAS: Record<DevPersonaId, DevPersona> = {
  student_nhs_beta: {
    id: "student_nhs_beta",
    label: "Student (NHS & Beta Member)",
    fullName: "Avery Chen",
    email: "avery.chen@pinelakeprep.org",
    role: "student",
    isTechManager: false,
    honorSocieties: ["NHS", "Beta Club"],
    gradeLevel: "11th",
    classes: ["A", "C", "E"],
  },
  teacher_advisor: {
    id: "teacher_advisor",
    label: "Teacher / Advisor",
    fullName: "Morgan Rivera",
    email: "m.rivera@pinelakeprep.org",
    role: "teacher",
    isTechManager: false,
    honorSocieties: [],
    gradeLevel: null,
    classes: [],
  },
  outside_org: {
    id: "outside_org",
    label: "Outside Non-Profit Representative",
    fullName: "Lakeside Food Bank",
    email: "programs@lakesidefoodbank.org",
    role: "outside_org",
    isTechManager: false,
    honorSocieties: [],
    gradeLevel: null,
    classes: [],
  },
  tech_manager: {
    id: "tech_manager",
    label: "Tech Manager / Admin",
    fullName: "Jordan Ellis",
    email: "jordan.ellis@pinelakeprep.org",
    role: "admin",
    isTechManager: true,
    honorSocieties: [],
    gradeLevel: null,
    classes: [],
  },
};

export const DEV_PERSONA_LIST: DevPersona[] = [
  DEV_PERSONAS.student_nhs_beta,
  DEV_PERSONAS.teacher_advisor,
  DEV_PERSONAS.outside_org,
  DEV_PERSONAS.tech_manager,
];

export function isDevPersonaId(
  value: string | null | undefined,
): value is DevPersonaId {
  return !!value && value in DEV_PERSONAS;
}

export function getDevPersona(
  value: string | null | undefined,
): DevPersona | null {
  return isDevPersonaId(value) ? DEV_PERSONAS[value] : null;
}

export function devPersonaToAccessProfile(persona: DevPersona): AccessProfile {
  return {
    role: persona.role,
    isTechManager: persona.isTechManager,
    honorSocieties: persona.honorSocieties,
  };
}

export function devPersonaToProfileRow(persona: DevPersona): UserRow {
  return {
    id: `dev-${persona.id}`,
    email: persona.email,
    full_name: persona.fullName,
    role: persona.role,
    grade_level: persona.gradeLevel,
    honor_societies: persona.honorSocieties,
    classes: persona.classes,
    is_tech_manager: persona.isTechManager,
    onboarding_completed: true,
  };
}
