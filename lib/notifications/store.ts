import type { NotificationRow } from "@/lib/database.types";
import { newId } from "@/lib/id";
import {
  createSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { SEED_NOTIFICATIONS } from "./seed";
import type { AppNotification, NewNotification } from "./types";

const DEMO_KEY = "prideserve-demo-notifications";

let notifications: AppNotification[] = SEED_NOTIFICATIONS;
let hydration: Promise<void> | null = null;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeToNotifications(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getNotificationsSnapshot(): AppNotification[] {
  return notifications;
}

export function getSeedNotificationsSnapshot(): AppNotification[] {
  return SEED_NOTIFICATIONS;
}

function rowToNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    title: row.title,
    message: row.message,
    href: row.href,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

function sortNewestFirst(list: AppNotification[]): AppNotification[] {
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function readDemo(): AppNotification[] | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(DEMO_KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : null;
  } catch {
    return null;
  }
}

function writeDemo(list: AppNotification[]) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(DEMO_KEY, JSON.stringify(list));
  } catch {
  }
}

async function loadFromSupabase() {
  const supabase = createSupabaseClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (data) {
    notifications = (data as NotificationRow[]).map(rowToNotification);
  }
}

async function runHydration() {
  if (isSupabaseConfigured()) {
    await loadFromSupabase();
  } else {
    notifications = sortNewestFirst(readDemo() ?? SEED_NOTIFICATIONS);
  }
  emit();
}

export function hydrateNotifications(): Promise<void> {
  hydration ??= runHydration();
  return hydration;
}

export async function refreshNotifications(): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }
  await loadFromSupabase();
  emit();
}

export async function emitNotifications(
  inputs: NewNotification[],
): Promise<void> {
  if (isSupabaseConfigured()) {
    await refreshNotifications();
    return;
  }

  const created = inputs
    .filter((input): input is NewNotification & { userId: string } =>
      Boolean(input.userId),
    )
    .map<AppNotification>((input) => ({
      id: newId("notif"),
      userId: input.userId,
      category: input.category,
      title: input.title,
      message: input.message,
      href: input.href ?? null,
      isRead: false,
      createdAt: new Date().toISOString(),
    }));

  if (created.length === 0) {
    return;
  }

  notifications = sortNewestFirst([...created, ...notifications]);
  writeDemo(notifications);
  emit();
}

export async function markNotificationRead(id: string): Promise<void> {
  notifications = notifications.map((item) =>
    item.id === id ? { ...item, isRead: true } : item,
  );
  emit();

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    return;
  }

  writeDemo(notifications);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  notifications = notifications.map((item) =>
    item.userId === userId ? { ...item, isRead: true } : item,
  );
  emit();

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId);
    return;
  }

  writeDemo(notifications);
}
