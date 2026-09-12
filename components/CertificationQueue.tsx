"use client";

import { useState } from "react";
import { Check, Loader2, ShieldCheck, X } from "lucide-react";
import { reviewTask } from "@/lib/tasks/store";
import {
  LOCATION_LABELS,
  RECURRENCE_LABELS,
  formatEventDate,
  type ServiceTask,
} from "@/lib/tasks/types";
import { useServiceTasks, useTaskViewer } from "@/lib/tasks/useTasks";
import { pendingReviewTasks } from "@/lib/tasks/visibility";

function sourceLabel(task: ServiceTask): string {
  return task.organizationName ? "External" : "Internal";
}

export default function CertificationQueue() {
  const tasks = useServiceTasks();
  const viewer = useTaskViewer();
  const pending = pendingReviewTasks(tasks);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canReview = Boolean(
    viewer && (viewer.isTechManager || viewer.role === "admin"),
  );

  async function decide(
    task: ServiceTask,
    status: "approved" | "rejected",
    notes: string | null,
  ) {
    setError(null);
    setNotice(null);
    setBusyId(task.id);
    try {
      await reviewTask(task.id, status, notes);
      setNotice(
        status === "approved"
          ? `“${task.title}” is certified and now live on the public task feed.`
          : `“${task.title}” was rejected and the requester can see your feedback.`,
      );
      setRejectingId(null);
      setFeedback("");
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Could not record the decision.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (!canReview) {
    return (
      <div className="rounded-xl border border-plp-slate-border bg-white p-6 text-sm text-slate-600 shadow-sm">
        Only admins and Tech Managers can certify submitted requests.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {error ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-700">
          {notice}
        </p>
      ) : null}

      {pending.length === 0 ? (
        <div className="rounded-xl border border-dashed border-plp-slate-border bg-white px-6 py-16 text-center">
          <ShieldCheck className="mx-auto h-6 w-6 text-emerald-600" />
          <p className="mt-3 text-sm font-semibold text-plp-navy">
            Queue is clear
          </p>
          <p className="mt-1 text-sm text-slate-500">
            No internal or external requests are waiting on certification.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-plp-slate-border bg-white shadow-sm">
          <table className="w-full min-w-3xl border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-plp-slate-border bg-plp-slate-surface text-xs uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-4 py-3 font-semibold">
                  Request
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Source
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Date &amp; time
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Volunteers
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Hours
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Decision
                </th>
              </tr>
            </thead>
            <tbody>
              {pending.map((task) => {
                const busy = busyId === task.id;
                return (
                  <tr
                    key={task.id}
                    className="border-b border-plp-slate-border align-top last:border-b-0"
                  >
                    <td className="max-w-sm px-4 py-4">
                      <p className="font-semibold text-plp-navy">
                        {task.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {task.requestedBy} · {task.category}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        {task.description}
                      </p>

                      {rejectingId === task.id ? (
                        <div className="mt-3">
                          <label
                            htmlFor={`feedback-${task.id}`}
                            className="mb-1 block text-xs font-medium text-slate-500"
                          >
                            Feedback for the requester
                          </label>
                          <textarea
                            id={`feedback-${task.id}`}
                            rows={3}
                            value={feedback}
                            onChange={(event) =>
                              setFeedback(event.target.value)
                            }
                            placeholder="Explain what needs to change before this can be certified."
                            className="w-full rounded-lg border border-plp-slate-border bg-plp-slate-surface px-3 py-2 text-sm outline-none ring-plp-navy focus:border-plp-navy focus:ring-2"
                          />
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                decide(task, "rejected", feedback)
                              }
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                            >
                              Send rejection
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingId(null);
                                setFeedback("");
                              }}
                              className="rounded-lg border border-plp-slate-border px-3 py-1.5 text-xs font-semibold text-plp-navy"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                          task.organizationName
                            ? "bg-sky-50 text-sky-700 ring-sky-200"
                            : "bg-plp-slate-surface text-slate-600 ring-plp-slate-border"
                        }`}
                      >
                        {sourceLabel(task)}
                      </span>
                      <p className="mt-1.5 text-xs text-slate-500">
                        {LOCATION_LABELS[task.location]}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-xs text-slate-600">
                      <p>{formatEventDate(task.eventDate)}</p>
                      {task.blockTime ? (
                        <p className="mt-1 text-slate-500">{task.blockTime}</p>
                      ) : null}
                      {task.recurrencePattern ? (
                        <p className="mt-1 text-slate-500">
                          Repeats {RECURRENCE_LABELS[task.recurrencePattern]}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-4 py-4 text-xs text-slate-600">
                      {task.requiredVolunteers ?? "—"}
                    </td>

                    <td className="px-4 py-4 text-xs text-slate-600">
                      {task.hoursValue}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => decide(task, "approved", null)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-plp-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-plp-navy-dark disabled:opacity-60"
                        >
                          {busy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Certify &amp; Publish
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setRejectingId(task.id);
                            setFeedback("");
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject with Feedback
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
