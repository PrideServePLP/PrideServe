import type {
  HonorSociety,
  OpportunityRow,
  OpportunityStatus,
} from "@/lib/database.types";
import { newId } from "@/lib/id";
import { emitNotifications } from "@/lib/notifications/store";
import {
  createSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { SEED_STUDENTS, SEED_TASKS } from "./seed";
import type { NewTaskInput, ServiceTask, StudentOption } from "./types";

const DEMO_TASKS_KEY = "prideserve-demo-tasks";
const DEMO_REVIEWS_KEY = "prideserve-demo-reviews";
const DEMO_SIGNUPS_KEY = "prideserve-demo-signups";

type DemoReview = { status: OpportunityStatus; reviewNotes: string | null };

/** `${opportunityId}:${studentId}` for every active registration. */
const NO_SIGNUPS: string[] = [];

let tasks: ServiceTask[] = SEED_TASKS;
let students: StudentOption[] = SEED_STUDENTS;
let signups: string[] = NO_SIGNUPS;
let hydration: Promise<void> | null = null;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeToTasks(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getTasksSnapshot(): ServiceTask[] {
  return tasks;
}

export function getStudentsSnapshot(): StudentOption[] {
  return students;
}

export function getSignupsSnapshot(): string[] {
  return signups;
}

export function getSeedSignupsSnapshot(): string[] {
  return NO_SIGNUPS;
}

export function signupKey(taskId: string, studentId: string): string {
  return `${taskId}:${studentId}`;
}

/** Stable snapshot for SSR and the first client render. */
export function getSeedTasksSnapshot(): ServiceTask[] {
  return SEED_TASKS;
}

export function getSeedStudentsSnapshot(): StudentOption[] {
  return SEED_STUDENTS;
}

type OpportunityWithCreator = OpportunityRow & {
  creator: { full_name: string } | null;
};

function rowToTask(row: OpportunityWithCreator): ServiceTask {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    requestedBy:
      row.organization_name ?? row.creator?.full_name ?? "Pine Lake Prep",
    organizationName: row.organization_name,
    category: row.category,
    honorSociety: row.honor_society,
    serviceScope: row.service_scope,
    location: row.location,
    eventDate: row.event_date,
    blockTime: row.block_time,
    hoursValue: Number(row.hours_value),
    requiredVolunteers: row.required_volunteers,
    createdBy: row.created_by,
    assignedStudentId: row.assigned_student_id,
    isRecurring: row.is_recurring,
    recurrencePattern: row.recurrence_pattern,
    status: row.status,
    reviewNotes: row.review_notes,
  };
}

function replaceTask(next: ServiceTask) {
  tasks = tasks.map((task) => (task.id === next.id ? next : task));
}

function readDemoOverlay(): ServiceTask[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(DEMO_TASKS_KEY);
    return raw ? (JSON.parse(raw) as ServiceTask[]) : [];
  } catch {
    return [];
  }
}

function writeDemoOverlay(overlay: ServiceTask[]) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(DEMO_TASKS_KEY, JSON.stringify(overlay));
  } catch {
    // Storage can be unavailable in private windows; the in-memory copy stands.
  }
}

function readDemoReviews(): Record<string, DemoReview> {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(DEMO_REVIEWS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, DemoReview>) : {};
  } catch {
    return {};
  }
}

function writeDemoReview(id: string, review: DemoReview) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const all = readDemoReviews();
    all[id] = review;
    window.localStorage.setItem(DEMO_REVIEWS_KEY, JSON.stringify(all));
  } catch {
    // Storage can be unavailable in private windows; the in-memory copy stands.
  }
}

function readDemoSignups(): string[] {
  if (typeof window === "undefined") {
    return NO_SIGNUPS;
  }
  try {
    const raw = window.localStorage.getItem(DEMO_SIGNUPS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : NO_SIGNUPS;
  } catch {
    return NO_SIGNUPS;
  }
}

function writeDemoSignups(next: string[]) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(DEMO_SIGNUPS_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable in private windows; the in-memory copy stands.
  }
}

async function loadFromSupabase() {
  const supabase = createSupabaseClient();
  // Wait for the persisted session so RLS can return this student's rows.
  // A query fired before getSession() resolves looks like an anonymous user
  // and comes back empty, which makes every Sign Up button look available.
  await supabase.auth.getSession();

  const [opportunityResult, studentResult] = await Promise.all([
    supabase
      .from("opportunities")
      .select("*, creator:users!opportunities_created_by_fkey(full_name)")
      .order("event_date", { ascending: true }),
    supabase
      .from("users")
      .select("id, full_name, email, grade_level, honor_societies")
      .eq("role", "student")
      .order("full_name", { ascending: true }),
  ]);

  if (opportunityResult.data) {
    tasks = (opportunityResult.data as unknown as OpportunityWithCreator[]).map(
      rowToTask,
    );
  }

  if (studentResult.data) {
    students = studentResult.data.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      gradeLevel: row.grade_level,
      honorSocieties: (row.honor_societies ?? []) as HonorSociety[],
    }));
  }

  const { data: signupRows } = await supabase
    .from("event_signups")
    .select("opportunity_id, student_id")
    .neq("status", "canceled");

  signups = (signupRows ?? []).map((row) =>
    signupKey(row.opportunity_id, row.student_id),
  );
}

async function runHydration() {
  if (isSupabaseConfigured()) {
    await loadFromSupabase();
  } else {
    const overlay = readDemoOverlay();
    const reviews = readDemoReviews();
    tasks = [...SEED_TASKS, ...overlay].map((task) => {
      const review = reviews[task.id];
      return review
        ? { ...task, status: review.status, reviewNotes: review.reviewNotes }
        : task;
    });
    signups = readDemoSignups();
  }
  emit();
}

function startHydration(): Promise<void> {
  hydration ??= runHydration().finally(() => {
    hydration = null;
  });
  return hydration;
}

/** Loads live data; concurrent callers share one in-flight request. */
export function hydrateTasks(): Promise<void> {
  return startHydration();
}

/** Re-reads tasks and signups after login or a sign-up so the buttons stay honest. */
export function refreshTasks(): Promise<void> {
  return startHydration();
}

export async function createTask(input: NewTaskInput): Promise<ServiceTask> {
  const status = input.status ?? "approved";

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("opportunities")
      .insert({
        title: input.title,
        description: input.description,
        organization_name: input.organizationName ?? null,
        category: input.category,
        honor_society: input.honorSociety,
        service_scope: input.serviceScope,
        location: input.location,
        event_date: input.eventDate,
        block_time: input.blockTime,
        hours_value: input.hoursValue,
        required_volunteers: input.requiredVolunteers ?? null,
        created_by: input.createdBy,
        assigned_student_id: input.assignedStudentId,
        is_recurring: input.recurrencePattern !== null,
        recurrence_pattern: input.recurrencePattern ?? null,
        status,
      })
      .select("*, creator:users!opportunities_created_by_fkey(full_name)")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Could not save the request.");
    }

    const created = rowToTask(data as unknown as OpportunityWithCreator);
    tasks = [...tasks, created];
    emit();
    return created;
  }

  const created: ServiceTask = {
    id: newId("task"),
    title: input.title,
    description: input.description,
    requestedBy: input.requestedBy,
    organizationName: input.organizationName ?? null,
    category: input.category,
    honorSociety: input.honorSociety,
    serviceScope: input.serviceScope,
    location: input.location,
    eventDate: input.eventDate,
    blockTime: input.blockTime,
    hoursValue: input.hoursValue,
    requiredVolunteers: input.requiredVolunteers ?? null,
    createdBy: input.createdBy,
    assignedStudentId: input.assignedStudentId,
    isRecurring: Boolean(input.recurrencePattern),
    recurrencePattern: input.recurrencePattern ?? null,
    status,
    reviewNotes: null,
  };

  tasks = [...tasks, created];
  writeDemoOverlay([...readDemoOverlay(), created]);
  emit();
  return created;
}

/** Certification queue decision: approve and publish, or reject with feedback. */
export async function reviewTask(
  id: string,
  status: Extract<OpportunityStatus, "approved" | "rejected">,
  notes: string | null,
): Promise<ServiceTask> {
  const trimmed = notes?.trim() ? notes.trim() : null;

  if (status === "rejected" && !trimmed) {
    throw new Error("Rejections require feedback for the requester.");
  }

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.rpc("review_opportunity", {
      p_opportunity_id: id,
      p_status: status,
      p_notes: trimmed,
    });

    if (error || !data) {
      throw new Error(error?.message ?? "Could not record the decision.");
    }

    const reviewed = rowToTask({
      ...(data as OpportunityRow),
      creator: null,
    });
    replaceTask(reviewed);
    emit();
    await notifyRequesterOfReview(reviewed, trimmed);
    return reviewed;
  }

  const current = tasks.find((task) => task.id === id);
  if (!current) {
    throw new Error("That request no longer exists.");
  }

  const reviewed: ServiceTask = {
    ...current,
    status,
    reviewNotes: trimmed,
  };

  replaceTask(reviewed);
  writeDemoReview(id, { status, reviewNotes: trimmed });
  emit();
  await notifyRequesterOfReview(reviewed, trimmed);
  return reviewed;
}

function notifyRequesterOfReview(task: ServiceTask, notes: string | null) {
  const certified = task.status === "approved";
  return emitNotifications([
    {
      userId: task.createdBy,
      category: "certification",
      title: certified ? "Request certified" : "Request rejected",
      message: certified
        ? `"${task.title}" was certified and is now live on the public task feed.`
        : `"${task.title}" was not certified. ${notes ?? ""}`.trim(),
      href: certified ? "/" : "/org-dashboard",
    },
  ]);
}

/**
 * Reserves a student's spot and alerts the task owner. Mirrors the
 * `notify_on_signup` database trigger so the demo behaves like production.
 */
export async function signUpForTask(
  task: ServiceTask,
  studentId: string,
  studentName: string,
): Promise<void> {
  const key = signupKey(task.id, studentId);
  if (signups.includes(key)) {
    return;
  }

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from("event_signups")
      .insert({ opportunity_id: task.id, student_id: studentId });

    // 23505 is the unique index on an active (opportunity, student) pair —
    // the student is already reserved, which is the outcome we wanted.
    if (error && error.code !== "23505") {
      throw new Error(error.message);
    }

    signups = signups.includes(key) ? signups : [...signups, key];
    emit();
    // The database trigger already wrote both rows; this just re-reads them.
    await emitNotifications([]);
    await refreshTasks();
    return;
  }

  signups = [...signups, key];
  writeDemoSignups(signups);
  emit();

  await emitNotifications([
    {
      userId: task.createdBy,
      category: "signup",
      title: "New sign-up",
      message: `${studentName} signed up for "${task.title}".`,
      href: "/teacher-dashboard",
    },
    {
      userId: studentId,
      category: "signup",
      title: "You are signed up",
      message: `Your spot for "${task.title}" is reserved. Log your hours once you have served.`,
      href: "/my-hours",
    },
  ]);
}
