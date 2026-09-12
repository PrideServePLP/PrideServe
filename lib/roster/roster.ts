import type { HonorSociety } from "@/lib/database.types";
import type { HourLog } from "@/lib/hours/types";
import { signupKey } from "@/lib/tasks/store";
import type { ServiceTask, StudentOption } from "@/lib/tasks/types";

/**
 * Where a student stands with the verification office. Precedence runs
 * pending → rejected → verified → none so the badge always shows the state
 * that needs attention first.
 */
export type VerificationStatus = "pending" | "rejected" | "verified" | "none";

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  pending: "Pending review",
  rejected: "Needs attention",
  verified: "Fully verified",
  none: "No submissions",
};

export type RosterEntry = {
  student: StudentOption;
  verifiedHours: number;
  pendingHours: number;
  verificationStatus: VerificationStatus;
  /** Tasks the student reserved a spot for. */
  signedUpCount: number;
  /** Reserved tasks that already have a verified hour log behind them. */
  completedCount: number;
  logs: HourLog[];
};

function sumHours(logs: HourLog[]): number {
  return logs.reduce((total, log) => total + log.hoursLogged, 0);
}

function statusFor(logs: HourLog[]): VerificationStatus {
  if (logs.length === 0) {
    return "none";
  }
  if (logs.some((log) => log.status === "pending")) {
    return "pending";
  }
  if (logs.some((log) => log.status === "rejected")) {
    return "rejected";
  }
  return "verified";
}

export function buildRoster(
  students: StudentOption[],
  logs: HourLog[],
  tasks: ServiceTask[],
  signups: string[],
): RosterEntry[] {
  const signupSet = new Set(signups);

  return students.map((student) => {
    const own = logs.filter((log) => log.studentId === student.id);
    const verified = own.filter((log) => log.status === "verified");

    const reserved = tasks.filter((task) =>
      signupSet.has(signupKey(task.id, student.id)),
    );
    const completed = reserved.filter((task) =>
      verified.some((log) => log.opportunityId === task.id),
    );

    return {
      student,
      verifiedHours: sumHours(verified),
      pendingHours: sumHours(own.filter((log) => log.status === "pending")),
      verificationStatus: statusFor(own),
      signedUpCount: reserved.length,
      completedCount: completed.length,
      logs: own,
    };
  });
}

export type RosterFilters = {
  query: string;
  society: HonorSociety | "All";
  gradeLevel: string | "All";
  verification: VerificationStatus | "All";
};

export function filterRoster(
  entries: RosterEntry[],
  filters: RosterFilters,
): RosterEntry[] {
  const query = filters.query.trim().toLowerCase();

  return entries.filter((entry) => {
    const { student } = entry;

    if (
      query !== "" &&
      !`${student.fullName} ${student.email}`.toLowerCase().includes(query)
    ) {
      return false;
    }
    if (
      filters.society !== "All" &&
      !student.honorSocieties.includes(filters.society)
    ) {
      return false;
    }
    if (
      filters.gradeLevel !== "All" &&
      student.gradeLevel !== filters.gradeLevel
    ) {
      return false;
    }
    if (
      filters.verification !== "All" &&
      entry.verificationStatus !== filters.verification
    ) {
      return false;
    }
    return true;
  });
}

/** Grade levels actually present on the roster, ordered 9th through 12th. */
export function gradeLevelsIn(students: StudentOption[]): string[] {
  const grades = new Set(
    students
      .map((student) => student.gradeLevel)
      .filter((grade): grade is string => Boolean(grade)),
  );
  return [...grades].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
}
