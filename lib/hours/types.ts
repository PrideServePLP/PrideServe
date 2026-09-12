import type { HonorSociety, HourLogStatus } from "@/lib/database.types";

/** A row of `hour_logs` in the shape the UI consumes. */
export type HourLog = {
  id: string;
  studentId: string;
  studentName: string;
  opportunityId: string | null;
  activityTitle: string;
  honorSociety: HonorSociety | null;
  serviceDate: string;
  hoursLogged: number;
  reflectionText: string | null;
  proofPhotoUrl: string | null;
  supervisorName: string | null;
  supervisorEmail: string | null;
  supervisorPhone: string | null;
  supervisorConfirmed: boolean;
  status: HourLogStatus;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type NewHourLogInput = {
  studentId: string;
  studentName: string;
  opportunityId: string | null;
  activityTitle: string;
  honorSociety: HonorSociety | null;
  serviceDate: string;
  hoursLogged: number;
  reflectionText: string | null;
  proofPhotoUrl: string | null;
  supervisorName: string | null;
  supervisorEmail: string | null;
  supervisorPhone: string | null;
};

export const HOUR_STATUS_LABELS: Record<HourLogStatus, string> = {
  pending: "Pending Verification",
  verified: "Verified",
  rejected: "Rejected",
};

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** Fixed to UTC so the server and client render identical strings. */
export function formatServiceDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

export function formatHourTotal(hours: number): string {
  return Number.isInteger(hours) ? `${hours}` : hours.toFixed(2).replace(/0$/, "");
}

export function formatHourCount(hours: number): string {
  return `${formatHourTotal(hours)} ${hours === 1 ? "hr" : "hrs"}`;
}
