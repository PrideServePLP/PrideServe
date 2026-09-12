import type { HourLogRow, HourLogStatus } from "@/lib/database.types";
import { newId } from "@/lib/id";
import { emitNotifications } from "@/lib/notifications/store";
import {
  createSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { SEED_HOUR_LOGS } from "./seed";
import type { HourLog, NewHourLogInput } from "./types";

const DEMO_LOGS_KEY = "prideserve-demo-hour-logs";
const DEMO_REVIEWS_KEY = "prideserve-demo-hour-reviews";

type DemoReview = {
  status: HourLogStatus;
  reviewNotes: string | null;
  reviewedAt: string;
};

let logs: HourLog[] = SEED_HOUR_LOGS;
let hydration: Promise<void> | null = null;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeToHourLogs(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getHourLogsSnapshot(): HourLog[] {
  return logs;
}

/** Stable snapshot for SSR and the first client render. */
export function getSeedHourLogsSnapshot(): HourLog[] {
  return SEED_HOUR_LOGS;
}

type HourLogWithRelations = HourLogRow & {
  student: { full_name: string } | null;
  opportunity: { title: string; honor_society: string | null } | null;
};

function rowToLog(row: HourLogWithRelations): HourLog {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student?.full_name ?? "Student",
    opportunityId: row.opportunity_id,
    activityTitle:
      row.activity_title ?? row.opportunity?.title ?? "Service activity",
    honorSociety: row.honor_society,
    serviceDate: row.service_date,
    hoursLogged: Number(row.hours_logged),
    reflectionText: row.reflection_text,
    proofPhotoUrl: row.proof_photo_url,
    supervisorName: row.supervisor_name,
    supervisorEmail: row.supervisor_email,
    supervisorPhone: row.supervisor_phone,
    supervisorConfirmed: row.supervisor_signature_status,
    status: row.status,
    reviewNotes: row.review_notes,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}

function readDemoOverlay(): HourLog[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(DEMO_LOGS_KEY);
    return raw ? (JSON.parse(raw) as HourLog[]) : [];
  } catch {
    return [];
  }
}

function writeDemoOverlay(overlay: HourLog[]) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(DEMO_LOGS_KEY, JSON.stringify(overlay));
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

function writeDemoReviews(entries: Record<string, DemoReview>) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const all = { ...readDemoReviews(), ...entries };
    window.localStorage.setItem(DEMO_REVIEWS_KEY, JSON.stringify(all));
  } catch {
    // Storage can be unavailable in private windows; the in-memory copy stands.
  }
}

function applyReview(review: DemoReview) {
  return {
    status: review.status,
    reviewNotes: review.reviewNotes,
    reviewedAt: review.reviewedAt,
    supervisorConfirmed: review.status === "verified",
  };
}

const SELECT_WITH_RELATIONS =
  "*, student:users!hour_logs_student_id_fkey(full_name), opportunity:opportunities(title, honor_society)";

async function loadFromSupabase() {
  const supabase = createSupabaseClient();
  const { data } = await supabase
    .from("hour_logs")
    .select(SELECT_WITH_RELATIONS)
    .order("created_at", { ascending: false });

  if (data) {
    logs = (data as unknown as HourLogWithRelations[]).map(rowToLog);
  }
}

async function runHydration() {
  if (isSupabaseConfigured()) {
    await loadFromSupabase();
  } else {
    const reviews = readDemoReviews();
    logs = [...SEED_HOUR_LOGS, ...readDemoOverlay()].map((log) => {
      const review = reviews[log.id];
      return review ? { ...log, ...applyReview(review) } : log;
    });
  }
  emit();
}

/** Loads live data once per page session; safe to call from every component. */
export function hydrateHourLogs(): Promise<void> {
  hydration ??= runHydration();
  return hydration;
}

export async function createHourLog(
  input: NewHourLogInput,
): Promise<HourLog> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("hour_logs")
      .insert({
        student_id: input.studentId,
        opportunity_id: input.opportunityId,
        activity_title: input.activityTitle,
        honor_society: input.honorSociety,
        service_date: input.serviceDate,
        hours_logged: input.hoursLogged,
        reflection_text: input.reflectionText,
        proof_photo_url: input.proofPhotoUrl,
        supervisor_name: input.supervisorName,
        supervisor_email: input.supervisorEmail,
        supervisor_phone: input.supervisorPhone,
      })
      .select(SELECT_WITH_RELATIONS)
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Could not save the hour log.");
    }

    const created = rowToLog(data as unknown as HourLogWithRelations);
    logs = [created, ...logs];
    emit();
    return created;
  }

  const created: HourLog = {
    ...input,
    id: newId("log"),
    supervisorConfirmed: false,
    status: "pending",
    reviewNotes: null,
    reviewedAt: null,
    createdAt: new Date().toISOString(),
  };

  logs = [created, ...logs];
  writeDemoOverlay([...readDemoOverlay(), created]);
  emit();
  return created;
}

/**
 * Verification pipeline decision. Accepts many ids so the approvals table can
 * settle a bulk selection in one call.
 */
export async function reviewHourLogs(
  ids: string[],
  status: Extract<HourLogStatus, "verified" | "rejected">,
  notes: string | null,
): Promise<number> {
  const trimmed = notes?.trim() ? notes.trim() : null;

  if (ids.length === 0) {
    throw new Error("Select at least one hour claim.");
  }

  if (status === "rejected" && !trimmed) {
    throw new Error("Rejections require feedback for the student.");
  }

  const affected = logs.filter(
    (log) => ids.includes(log.id) && log.status === "pending",
  );

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient();
    const { error } = await supabase.rpc("review_hour_logs", {
      p_log_ids: ids,
      p_status: status,
      p_notes: trimmed,
    });

    if (error) {
      throw new Error(error.message);
    }

    await loadFromSupabase();
    emit();
  } else {
    const reviewedAt = new Date().toISOString();
    const reviews: Record<string, DemoReview> = {};
    affected.forEach((log) => {
      reviews[log.id] = { status, reviewNotes: trimmed, reviewedAt };
    });

    logs = logs.map((log) =>
      reviews[log.id] ? { ...log, ...applyReview(reviews[log.id]) } : log,
    );
    writeDemoReviews(reviews);
    emit();
  }

  await emitNotifications(
    affected.map((log) => ({
      userId: log.studentId,
      category: "hours" as const,
      title: status === "verified" ? "Hours verified" : "Hours rejected",
      message:
        status === "verified"
          ? `${log.hoursLogged} hours for "${log.activityTitle}" were verified.`
          : `Your log for "${log.activityTitle}" was rejected. ${trimmed ?? ""}`.trim(),
      href: "/my-hours",
    })),
  );

  return affected.length;
}
