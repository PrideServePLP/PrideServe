"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { HonorSociety } from "@/lib/database.types";
import { useAuth } from "@/components/AuthProvider";
import {
  getSeedSignupsSnapshot,
  getSeedStudentsSnapshot,
  getSeedTasksSnapshot,
  getSignupsSnapshot,
  getStudentsSnapshot,
  getTasksSnapshot,
  hydrateTasks,
  refreshTasks,
  subscribeToTasks,
} from "./store";
import type { ServiceTask, StudentOption } from "./types";
import type { TaskViewer } from "./visibility";

function useHydrateTaskStore() {
  const { loading, isSignedIn, profile } = useAuth();

  useEffect(() => {
    void hydrateTasks();
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }
    void refreshTasks();
  }, [loading, isSignedIn, profile?.id]);
}

export function useServiceTasks(): ServiceTask[] {
  const tasks = useSyncExternalStore(
    subscribeToTasks,
    getTasksSnapshot,
    getSeedTasksSnapshot,
  );

  useHydrateTaskStore();
  return tasks;
}

export function useStudentDirectory(): StudentOption[] {
  const students = useSyncExternalStore(
    subscribeToTasks,
    getStudentsSnapshot,
    getSeedStudentsSnapshot,
  );

  useHydrateTaskStore();
  return students;
}

/** Keys of the form `${opportunityId}:${studentId}` for active registrations. */
export function useSignups(): string[] {
  const signups = useSyncExternalStore(
    subscribeToTasks,
    getSignupsSnapshot,
    getSeedSignupsSnapshot,
  );

  useHydrateTaskStore();
  return signups;
}

/** The signed-in profile (or active dev persona) reduced to access fields. */
export function useTaskViewer(): TaskViewer {
  const { profile } = useAuth();
  if (!profile) {
    return null;
  }
  return {
    id: profile.id,
    role: profile.role,
    isTechManager: profile.is_tech_manager,
    honorSocieties: (profile.honor_societies ?? []) as HonorSociety[],
  };
}
