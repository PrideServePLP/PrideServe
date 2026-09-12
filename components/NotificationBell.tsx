"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarCheck,
  Clock3,
  Info,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { NotificationCategory } from "@/lib/database.types";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/store";
import { formatNotificationTime } from "@/lib/notifications/types";
import { useNotifications } from "@/lib/notifications/useNotifications";
import { useTaskViewer } from "@/lib/tasks/useTasks";

const CATEGORY_ICONS: Record<NotificationCategory, LucideIcon> = {
  signup: CalendarCheck,
  certification: ShieldCheck,
  hours: Clock3,
  general: Info,
};

const CATEGORY_STYLES: Record<NotificationCategory, string> = {
  signup: "bg-sky-50 text-sky-700",
  certification: "bg-emerald-50 text-emerald-700",
  hours: "bg-indigo-50 text-indigo-700",
  general: "bg-plp-slate-surface text-slate-600",
};

export default function NotificationBell() {
  const viewer = useTaskViewer();
  const notifications = useNotifications(viewer?.id ?? null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((item) => !item.isRead).length;

  useEffect(() => {
    if (!open) {
      return;
    }
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-full p-2 text-slate-500 hover:bg-plp-slate-surface hover:text-plp-navy"
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border border-plp-slate-border bg-white shadow-lg sm:w-96">
          <div className="flex items-center justify-between border-b border-plp-slate-border px-4 py-3">
            <p className="text-sm font-semibold text-plp-navy">Notifications</p>
            {unread > 0 && viewer ? (
              <button
                type="button"
                onClick={() => void markAllNotificationsRead(viewer.id)}
                className="text-xs font-medium text-plp-navy hover:underline"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              You are all caught up.
            </p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {notifications.map((item) => {
                const Icon = CATEGORY_ICONS[item.category];
                const body = (
                  <>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${CATEGORY_STYLES[item.category]}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-plp-navy">
                          {item.title}
                        </span>
                        {item.isRead ? null : (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" />
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-600">
                        {item.message}
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-400">
                        {formatNotificationTime(item.createdAt)}
                      </span>
                    </span>
                  </>
                );

                const className = `flex w-full gap-3 border-b border-plp-slate-border px-4 py-3 text-left last:border-b-0 hover:bg-plp-slate-surface ${
                  item.isRead ? "" : "bg-sky-50/40"
                }`;

                return (
                  <li key={item.id}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className={className}
                        onClick={() => {
                          void markNotificationRead(item.id);
                          setOpen(false);
                        }}
                      >
                        {body}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className={className}
                        onClick={() => void markNotificationRead(item.id)}
                      >
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
