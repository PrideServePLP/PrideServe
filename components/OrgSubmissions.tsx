"use client";

import { useServiceTasks, useTaskViewer } from "@/lib/tasks/useTasks";
import { tasksCreatedBy } from "@/lib/tasks/visibility";
import TaskCard from "@/components/tasks/TaskCard";

export default function OrgSubmissions() {
  const tasks = useServiceTasks();
  const viewer = useTaskViewer();
  const mine = tasksCreatedBy(tasks, viewer?.id);

  const pending = mine.filter(
    (task) => task.status === "pending_certification",
  ).length;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-plp-navy">
          Your submissions
        </h2>
        <p className="text-sm text-slate-500">
          {pending} awaiting certification. Rejected requests include feedback
          you can act on before resubmitting.
        </p>
      </div>

      {mine.length === 0 ? (
        <div className="rounded-xl border border-dashed border-plp-slate-border bg-white px-6 py-12 text-center text-sm text-slate-500">
          You have not submitted a volunteer request yet.
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {mine.map((task) => (
            <TaskCard key={task.id} task={task} showStatus />
          ))}
        </ul>
      )}
    </section>
  );
}
