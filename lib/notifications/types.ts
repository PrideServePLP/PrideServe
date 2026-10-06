import type { NotificationCategory } from "@/lib/database.types";

export type AppNotification = {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  message: string;
  href: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NewNotification = {
  userId: string | null | undefined;
  category: NotificationCategory;
  title: string;
  message: string;
  href?: string | null;
};

const TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatNotificationTime(iso: string): string {
  return TIME_FORMAT.format(new Date(iso));
}
