"use client";

import { Lock } from "lucide-react";
import type { HonorSociety } from "@/lib/database.types";
import { useServiceTasks, useTaskViewer } from "@/lib/tasks/useTasks";
import { isSocietyMember, societyTasks } from "@/lib/tasks/visibility";
import TaskCard from "@/components/tasks/TaskCard";

export default function SocietyTaskPanel({
  society,
}: {
  society: HonorSociety;
}) {
  const tasks = useServiceTasks();
  const viewer = useTaskViewer();
  const member = isSocietyMember(viewer, society);

  if (!member) {
    return (
      <div className="rounded-xl border border-dashed border-plp-slate-border bg-white px-6 py-16 text-center">
        <Lock className="mx-auto h-6 w-6 text-slate-400" />
        <p className="mt-3 text-sm font-semibold text-plp-navy">
          {society} is locked
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Only students on the {society} roster can see this chapter&apos;s
          service tasks. Ask your advisor to add you.
        </p>
      </div>
    );
  }

  const visible = societyTasks(tasks, society);
  const clubHours = visible
    .filter((task) => task.serviceScope === "club_internal")
    .reduce((total, task) => total + task.hoursValue, 0);
  const communityHours = visible
    .filter((task) => task.serviceScope === "community_external")
    .reduce((total, task) => total + task.hoursValue, 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-plp-navy">{society}</h2>
        <p className="text-sm text-slate-500">
          {visible.length} open task{visible.length === 1 ? "" : "s"} ·{" "}
          {clubHours} club hour{clubHours === 1 ? "" : "s"} · {communityHours}{" "}
          community hour{communityHours === 1 ? "" : "s"}
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-plp-slate-border bg-white px-6 py-16 text-center text-sm text-slate-500">
          No open {society} tasks right now. Check back after the next chapter
          meeting.
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {visible.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </ul>
      )}
    </div>
  );
}
