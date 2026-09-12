"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  getNotificationsSnapshot,
  getSeedNotificationsSnapshot,
  hydrateNotifications,
  subscribeToNotifications,
} from "./store";
import type { AppNotification } from "./types";

/** Notifications addressed to one user, newest first. */
export function useNotifications(userId: string | null): AppNotification[] {
  const all = useSyncExternalStore(
    subscribeToNotifications,
    getNotificationsSnapshot,
    getSeedNotificationsSnapshot,
  );

  useEffect(() => {
    void hydrateNotifications();
  }, []);

  return useMemo(
    () => (userId ? all.filter((item) => item.userId === userId) : []),
    [all, userId],
  );
}
