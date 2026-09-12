import type {
  HonorSociety,
  OpportunityCategory,
  OpportunityLocation,
  OpportunityStatus,
  RecurrencePattern,
  ServiceScope,
} from "@/lib/database.types";

/** A row of `opportunities` in the shape the UI consumes. */
export type ServiceTask = {
  id: string;
  title: string;
  description: string;
  requestedBy: string;
  organizationName: string | null;
  category: OpportunityCategory;
  honorSociety: HonorSociety | null;
  serviceScope: ServiceScope;
  location: OpportunityLocation;
  eventDate: string;
  blockTime: string | null;
  hoursValue: number;
  requiredVolunteers: number | null;
  createdBy: string;
  assignedStudentId: string | null;
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern | null;
  status: OpportunityStatus;
  reviewNotes: string | null;
};

export type StudentOption = {
  id: string;
  fullName: string;
  email: string;
  gradeLevel: string | null;
  honorSocieties: HonorSociety[];
};

export type NewTaskInput = {
  title: string;
  description: string;
  requestedBy: string;
  organizationName?: string | null;
  category: OpportunityCategory;
  honorSociety: HonorSociety | null;
  serviceScope: ServiceScope;
  location: OpportunityLocation;
  eventDate: string;
  blockTime: string | null;
  hoursValue: number;
  requiredVolunteers?: number | null;
  createdBy: string;
  assignedStudentId: string | null;
  recurrencePattern?: RecurrencePattern | null;
  status?: OpportunityStatus;
};

export const LOCATION_LABELS: Record<OpportunityLocation, string> = {
  in_school: "In-School",
  after_school: "After School",
  out_of_school: "Out-of-School",
};

export const SCOPE_LABELS: Record<ServiceScope, string> = {
  club_internal: "Club service hours",
  community_external: "Community service hours",
};

export const SCOPE_OPTIONS: { value: ServiceScope; label: string }[] = [
  { value: "club_internal", label: "Internal club service" },
  { value: "community_external", label: "External community service" },
];

export const LOCATION_OPTIONS: {
  value: OpportunityLocation;
  label: string;
}[] = [
  { value: "in_school", label: "In-School" },
  { value: "after_school", label: "After School" },
  { value: "out_of_school", label: "Out-of-School" },
];

export const RECURRENCE_LABELS: Record<RecurrencePattern, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export const RECURRENCE_OPTIONS: {
  value: RecurrencePattern;
  label: string;
}[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export const STATUS_LABELS: Record<OpportunityStatus, string> = {
  pending_certification: "Pending certification",
  approved: "Approved",
  rejected: "Rejected",
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Deterministic UTC formatting so server and client markup agree. */
export function formatEventDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function formatHours(hours: number): string {
  return `${hours} verified hour${hours === 1 ? "" : "s"}`;
}
