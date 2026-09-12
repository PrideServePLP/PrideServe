import type { HonorSociety, UserRole } from "@/lib/database.types";
import type { ServiceTask } from "./types";

export type TaskViewer = {
  id: string;
  role: UserRole;
  isTechManager: boolean;
  honorSocieties: HonorSociety[];
} | null;

export function isPrivateTask(task: ServiceTask): boolean {
  return task.assignedStudentId !== null;
}

export function isStaffViewer(viewer: TaskViewer): boolean {
  if (!viewer) {
    return false;
  }
  return (
    viewer.isTechManager ||
    viewer.role === "teacher" ||
    viewer.role === "ta" ||
    viewer.role === "admin"
  );
}

export function isSocietyMember(
  viewer: TaskViewer,
  society: HonorSociety,
): boolean {
  return Boolean(viewer?.honorSocieties.includes(society));
}

/**
 * Society tasks a member should see: approved, not privately assigned.
 * Private society tasks stay on the assignee's own feed.
 */
export function societyTasks(
  tasks: ServiceTask[],
  society: HonorSociety,
): ServiceTask[] {
  return tasks.filter(
    (task) =>
      task.honorSociety === society &&
      task.status === "approved" &&
      !isPrivateTask(task),
  );
}

/**
 * The open, school-wide feed: approved, not privately assigned, and not
 * limited to one honor society chapter.
 */
export function publicFeedTasks(tasks: ServiceTask[]): ServiceTask[] {
  return tasks.filter(
    (task) =>
      task.status === "approved" &&
      task.honorSociety === null &&
      !isPrivateTask(task),
  );
}

/** Everything waiting on a Tech Manager decision, soonest event first. */
export function pendingReviewTasks(tasks: ServiceTask[]): ServiceTask[] {
  return tasks
    .filter((task) => task.status === "pending_certification")
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
}

/** Private requests targeted at one student. */
export function tasksAssignedTo(
  tasks: ServiceTask[],
  studentId: string | null | undefined,
): ServiceTask[] {
  if (!studentId) {
    return [];
  }
  return tasks.filter((task) => task.assignedStudentId === studentId);
}

/** Everything a given creator posted, newest event first. */
export function tasksCreatedBy(
  tasks: ServiceTask[],
  creatorId: string | null | undefined,
): ServiceTask[] {
  if (!creatorId) {
    return [];
  }
  return tasks
    .filter((task) => task.createdBy === creatorId)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
}
