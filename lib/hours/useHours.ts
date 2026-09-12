"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getHourLogsSnapshot,
  getSeedHourLogsSnapshot,
  hydrateHourLogs,
  subscribeToHourLogs,
} from "./store";
import type { HourLog } from "./types";

export function useHourLogs(): HourLog[] {
  const logs = useSyncExternalStore(
    subscribeToHourLogs,
    getHourLogsSnapshot,
    getSeedHourLogsSnapshot,
  );

  useEffect(() => {
    void hydrateHourLogs();
  }, []);

  return logs;
}
