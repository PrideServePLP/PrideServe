"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { buildProgressTracks } from "@/lib/hours/requirements";
import { formatHourTotal, formatServiceDate } from "@/lib/hours/types";
import { useHourLogs } from "@/lib/hours/useHours";
import { useTaskViewer } from "@/lib/tasks/useTasks";
import HourProgress from "@/components/hours/HourProgress";
import HourStatusBadge from "@/components/hours/HourStatusBadge";
import LogHoursModal from "@/components/hours/LogHoursModal";

export default function StudentHours() {
  const viewer = useTaskViewer();
  const allLogs = useHourLogs();
  const [modalOpen, setModalOpen] = useState(false);

  const logs = useMemo(
    () =>
      viewer
        ? allLogs
            .filter((log) => log.studentId === viewer.id)
            .sort((a, b) => b.serviceDate.localeCompare(a.serviceDate))
        : [],
    [allLogs, viewer],
  );

  const tracks = useMemo(
    () => buildProgressTracks(logs, viewer?.honorSocieties ?? []),
    [logs, viewer],
  );

  const pendingCount = logs.filter((log) => log.status === "pending").length;

  if (!viewer) {
    return (
      <div className="rounded-xl border border-plp-slate-border bg-white p-6 text-sm text-slate-600 shadow-sm">
        Sign in to see your verified hours and submit new entries.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HourProgress tracks={tracks} />

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-plp-navy">
              Submitted hours
            </h2>
            <p className="text-sm text-slate-500">
              {pendingCount} {pendingCount === 1 ? "entry" : "entries"} awaiting
              verification.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-plp-navy px-4 py-2 text-sm font-semibold text-white hover:bg-plp-navy-dark"
          >
            <Plus className="h-4 w-4" />
            Log hours
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-plp-slate-border bg-white px-6 py-16 text-center text-sm text-slate-500">
            You have not submitted any service hours yet.
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-plp-slate-border bg-white shadow-sm">
            <table className="w-full min-w-3xl border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-plp-slate-border bg-plp-slate-surface text-xs uppercase tracking-wider text-slate-500">
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
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-plp-slate-border align-top last:border-b-0"
                  >
                    <td className="max-w-sm px-4 py-4">
                      <p className="font-semibold text-plp-navy">
                        {log.activityTitle}
                      </p>
                      {log.honorSociety ? (
                        <p className="mt-0.5 text-xs text-slate-500">
                          Counts toward {log.honorSociety}
                        </p>
                      ) : null}
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
                      {log.reviewNotes ? (
                        <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs leading-5 text-red-800">
                          <span className="font-semibold">
                            Reviewer feedback:
                          </span>{" "}
                          {log.reviewNotes}
                        </p>
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
                    <td className="px-4 py-4">
                      <HourStatusBadge status={log.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen ? (
        <LogHoursModal onClose={() => setModalOpen(false)} />
      ) : null}
    </div>
  );
}
