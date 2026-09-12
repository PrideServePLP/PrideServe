"use client";

import { Inbox } from "lucide-react";
import { useServiceTasks, useTaskViewer } from "@/lib/tasks/useTasks";
import { tasksAssignedTo } from "@/lib/tasks/visibility";
import TaskCard from "@/components/tasks/TaskCard";

export default function AssignedTasks({
  hideWhenEmpty = false,
}: {
  hideWhenEmpty?: boolean;
}) {
  const tasks = useServiceTasks();
  const viewer = useTaskViewer();
  const mine = tasksAssignedTo(tasks, viewer?.id);

  if (mine.length === 0) {
    if (hideWhenEmpty) {
      return null;
    }
    return (
      <div className="rounded-xl border border-dashed border-plp-slate-border bg-white px-6 py-12 text-center">
        <Inbox className="mx-auto h-6 w-6 text-slate-400" />
        <p className="mt-3 text-sm text-slate-500">
          No private requests right now. Teachers and advisors can assign a task
          directly to you.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-900">
          Assigned to you
        </h2>
        <p className="text-xs text-amber-800">
          {mine.length} private request{mine.length === 1 ? "" : "s"} · visible
          only to you
        </p>
      </div>

      <ul className="mt-3 grid gap-4 md:grid-cols-2">
        {mine.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </ul>
    </section>
  );
}
