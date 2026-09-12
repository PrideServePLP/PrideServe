import type { ReactNode } from "react";
import {
  CalendarDays,
  Clock3,
  Lock,
  MapPin,
  Repeat,
  Users,
} from "lucide-react";
import {
  LOCATION_LABELS,
  RECURRENCE_LABELS,
  SCOPE_LABELS,
  formatEventDate,
  formatHours,
  type ServiceTask,
} from "@/lib/tasks/types";
import StatusBadge from "@/components/tasks/StatusBadge";

const SCOPE_STYLES: Record<ServiceTask["serviceScope"], string> = {
  club_internal: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  community_external: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export default function TaskCard({
  task,
  assigneeName,
  showStatus = false,
  footer,
}: {
  task: ServiceTask;
  assigneeName?: string | null;
  showStatus?: boolean;
  footer?: ReactNode;
}) {
  const isPrivate = task.assignedStudentId !== null;

  return (
    <li className="flex flex-col rounded-xl border border-plp-slate-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-plp-navy">
            {task.title}
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">{task.requestedBy}</p>
        </div>
        <span className="shrink-0 rounded-full bg-plp-navy/10 px-2.5 py-1 text-xs font-semibold text-plp-navy">
          {formatHours(task.hoursValue)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {showStatus ? <StatusBadge status={task.status} /> : null}
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${SCOPE_STYLES[task.serviceScope]}`}
        >
          {SCOPE_LABELS[task.serviceScope]}
        </span>
        {task.honorSociety ? (
          <span className="rounded-full bg-plp-slate-surface px-2.5 py-1 text-xs font-medium text-plp-navy ring-1 ring-inset ring-plp-slate-border">
            {task.honorSociety}
          </span>
        ) : null}
        {isPrivate ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
            <Lock className="h-3 w-3" />
            {assigneeName
              ? `Private · ${assigneeName}`
              : "Private assignment"}
          </span>
        ) : null}
        {task.isRecurring ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-plp-slate-surface px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-plp-slate-border">
            <Repeat className="h-3 w-3" />
            {task.recurrencePattern
              ? RECURRENCE_LABELS[task.recurrencePattern]
              : "Recurring"}
          </span>
        ) : null}
      </div>

      <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
        {task.description}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 rounded-md bg-plp-slate-surface px-2 py-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-plp-navy" />
          <span>{formatEventDate(task.eventDate)}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md bg-plp-slate-surface px-2 py-1.5">
          <MapPin className="h-3.5 w-3.5 text-plp-navy" />
          <span>{LOCATION_LABELS[task.location]}</span>
        </div>
        {task.blockTime ? (
          <div className="flex items-center gap-1.5 rounded-md bg-plp-slate-surface px-2 py-1.5">
            <Clock3 className="h-3.5 w-3.5 text-plp-navy" />
            <span>{task.blockTime}</span>
          </div>
        ) : null}
        {task.requiredVolunteers ? (
          <div className="flex items-center gap-1.5 rounded-md bg-plp-slate-surface px-2 py-1.5">
            <Users className="h-3.5 w-3.5 text-plp-navy" />
            <span>{task.requiredVolunteers} volunteers needed</span>
          </div>
        ) : null}
      </dl>

      {task.reviewNotes ? (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs leading-5 text-red-800">
          <span className="font-semibold">Reviewer feedback:</span>{" "}
          {task.reviewNotes}
        </p>
      ) : null}

      {footer ? <div className="mt-4">{footer}</div> : null}
    </li>
  );
}
