"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, ShieldCheck, X } from "lucide-react";
import { reviewHourLogs } from "@/lib/hours/store";
import { formatHourTotal, formatServiceDate } from "@/lib/hours/types";
import { useHourLogs } from "@/lib/hours/useHours";
import { useTaskViewer } from "@/lib/tasks/useTasks";

export default function ApprovalsTable() {
  const viewer = useTaskViewer();
  const allLogs = useHourLogs();

  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const pending = useMemo(
    () =>
      allLogs
        .filter((log) => log.status === "pending")
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [allLogs],
  );

  const canReview = Boolean(
    viewer &&
      (viewer.isTechManager ||
        ["teacher", "ta", "admin"].includes(viewer.role)),
  );

  const activeSelection = selected.filter((id) =>
    pending.some((log) => log.id === id),
  );
  const allSelected =
    pending.length > 0 && activeSelection.length === pending.length;

  function toggleAll() {
    setSelected(allSelected ? [] : pending.map((log) => log.id));
  }

  function toggleOne(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  async function decide(status: "verified" | "rejected") {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const count = await reviewHourLogs(
        activeSelection,
        status,
        feedback.trim() === "" ? null : feedback,
      );
      setNotice(
        status === "verified"
          ? `${count} hour ${count === 1 ? "claim" : "claims"} verified. Students have been notified.`
          : `${count} hour ${count === 1 ? "claim" : "claims"} rejected with your feedback.`,
      );
      setSelected([]);
      setFeedback("");
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Could not record the decision.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!canReview) {
    return (
      <div className="rounded-xl border border-plp-slate-border bg-white p-6 text-sm text-slate-600 shadow-sm">
        Only teachers, advisors, and admins can verify student hour claims.
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
            Nothing to verify
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Every submitted hour claim has been reviewed.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-plp-slate-border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-64 flex-1">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">
                  Feedback (required to reject, optional to approve)
                </span>
                <input
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  placeholder="Explain what the student needs to change."
                  className="w-full rounded-lg border border-plp-slate-border bg-plp-slate-surface px-3 py-2 text-sm outline-none ring-plp-navy focus:border-plp-navy focus:ring-2"
                />
              </label>

              <button
                type="button"
                disabled={busy || activeSelection.length === 0}
                onClick={() => void decide("verified")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-plp-navy px-4 py-2 text-sm font-semibold text-white hover:bg-plp-navy-dark disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Approve selected ({activeSelection.length})
              </button>

              <button
                type="button"
                disabled={busy || activeSelection.length === 0}
                onClick={() => void decide("rejected")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Reject selected
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-plp-slate-border bg-white shadow-sm">
            <table className="w-full min-w-3xl border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-plp-slate-border bg-plp-slate-surface text-xs uppercase tracking-wider text-slate-500">
                  <th scope="col" className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Select all pending hour claims"
                      className="h-4 w-4 rounded border-plp-slate-border text-plp-navy"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Student
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Activity
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Date served
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Hours
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Supervisor
                  </th>
                </tr>
              </thead>
              <tbody>
                {pending.map((log) => {
                  const checked = selected.includes(log.id);
                  return (
                    <tr
                      key={log.id}
                      className={`border-b border-plp-slate-border align-top last:border-b-0 ${
                        checked ? "bg-sky-50/50" : ""
                      }`}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(log.id)}
                          aria-label={`Select ${log.activityTitle} from ${log.studentName}`}
                          className="h-4 w-4 rounded border-plp-slate-border text-plp-navy"
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <p className="font-semibold text-plp-navy">
                          {log.studentName}
                        </p>
                        {log.honorSociety ? (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {log.honorSociety}
                          </p>
                        ) : null}
                      </td>
                      <td className="max-w-sm px-4 py-4">
                        <p className="font-medium text-plp-navy">
                          {log.activityTitle}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {log.opportunityId
                            ? "From the task feed"
                            : "Manually logged"}
                        </p>
                        {log.reflectionText ? (
                          <p className="mt-2 text-xs leading-5 text-slate-600">
                            {log.reflectionText}
                          </p>
                        ) : null}
                        {log.proofPhotoUrl ? (
                          <a
                            href={log.proofPhotoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-xs font-medium text-plp-navy hover:underline"
                          >
                            View proof photo
                          </a>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-600">
                        {formatServiceDate(log.serviceDate)}
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-plp-navy">
                        {formatHourTotal(log.hoursLogged)}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600">
                        <p>{log.supervisorName ?? "—"}</p>
                        {log.supervisorEmail ? (
                          <p className="mt-0.5 text-slate-500">
                            {log.supervisorEmail}
                          </p>
                        ) : null}
                        {log.supervisorPhone ? (
                          <p className="mt-0.5 text-slate-500">
                            {log.supervisorPhone}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
