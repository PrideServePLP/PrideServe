"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import type { HonorSociety } from "@/lib/database.types";
import { formatHourTotal } from "@/lib/hours/types";
import { useHourLogs } from "@/lib/hours/useHours";
import {
  buildCsv,
  countExportableRows,
  csvFileName,
  downloadCsv,
} from "@/lib/roster/csv";
import {
  buildRoster,
  filterRoster,
  gradeLevelsIn,
  VERIFICATION_LABELS,
  type RosterEntry,
  type VerificationStatus,
} from "@/lib/roster/roster";
import {
  useServiceTasks,
  useSignups,
  useStudentDirectory,
  useTaskViewer,
} from "@/lib/tasks/useTasks";

const SOCIETIES: HonorSociety[] = [
  "NHS",
  "NJHS",
  "Beta Club",
  "Spanish Honor Society",
  "Science National Honor Society",
];

const VERIFICATION_OPTIONS: VerificationStatus[] = [
  "pending",
  "rejected",
  "verified",
  "none",
];

const STATUS_STYLES: Record<VerificationStatus, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  verified: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  none: "bg-plp-slate-surface text-slate-600 ring-plp-slate-border",
};

const selectClass =
  "w-full rounded-lg border border-plp-slate-border bg-plp-slate-surface px-3 py-2 text-sm outline-none ring-plp-navy focus:border-plp-navy focus:ring-2";
const labelClass = "mb-1.5 block text-xs font-medium text-slate-500";

function CompletionFlag({ entry }: { entry: RosterEntry }) {
  if (entry.signedUpCount === 0) {
    return <span className="text-xs text-slate-400">No sign-ups</span>;
  }

  const outstanding = entry.signedUpCount - entry.completedCount;
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        outstanding === 0
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-amber-50 text-amber-800 ring-amber-200"
      }`}
    >
      {entry.completedCount}/{entry.signedUpCount} complete
    </span>
  );
}

export default function RosterTable() {
  const viewer = useTaskViewer();
  const students = useStudentDirectory();
  const logs = useHourLogs();
  const tasks = useServiceTasks();
  const signups = useSignups();

  const [query, setQuery] = useState("");
  const [society, setSociety] = useState<HonorSociety | "All">("All");
  const [gradeLevel, setGradeLevel] = useState<string>("All");
  const [verification, setVerification] = useState<VerificationStatus | "All">(
    "All",
  );
  const [notice, setNotice] = useState<string | null>(null);

  const roster = useMemo(
    () => buildRoster(students, logs, tasks, signups),
    [students, logs, tasks, signups],
  );

  const filtered = useMemo(
    () => filterRoster(roster, { query, society, gradeLevel, verification }),
    [roster, query, society, gradeLevel, verification],
  );

  const grades = useMemo(() => gradeLevelsIn(students), [students]);
  const exportableRows = countExportableRows(filtered);
  const totalVerified = filtered.reduce(
    (total, entry) => total + entry.verifiedHours,
    0,
  );

  const canView = Boolean(
    viewer && (viewer.isTechManager || viewer.role === "admin"),
  );

  function handleExport() {
    downloadCsv(buildCsv(filtered), csvFileName());
    setNotice(
      `Exported ${exportableRows} ${exportableRows === 1 ? "row" : "rows"} for ${filtered.length} ${filtered.length === 1 ? "student" : "students"}. Import the file into the PLP hour tracking template.`,
    );
  }

  if (!canView) {
    return (
      <div className="rounded-xl border border-plp-slate-border bg-white p-6 text-sm text-slate-600 shadow-sm">
        Only admins and Tech Managers can view the master student roster.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-plp-slate-border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative">
            <span className={labelClass}>Search</span>
            <Search className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or email"
              className={`${selectClass} pl-9`}
            />
          </label>

          <label>
            <span className={labelClass}>Honor Society</span>
            <select
              value={society}
              onChange={(event) =>
                setSociety(event.target.value as HonorSociety | "All")
              }
              className={selectClass}
            >
              <option value="All">All societies</option>
              {SOCIETIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={labelClass}>Grade Level</span>
            <select
              value={gradeLevel}
              onChange={(event) => setGradeLevel(event.target.value)}
              className={selectClass}
            >
              <option value="All">All grades</option>
              {grades.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={labelClass}>Verification Status</span>
            <select
              value={verification}
              onChange={(event) =>
                setVerification(event.target.value as VerificationStatus | "All")
              }
              className={selectClass}
            >
              <option value="All">All statuses</option>
              {VERIFICATION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {VERIFICATION_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-plp-slate-border pt-4">
          <p className="text-sm text-slate-500">
            {filtered.length} of {roster.length} students ·{" "}
            {formatHourTotal(totalVerified)} verified hours ·{" "}
            {exportableRows} exportable rows
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={exportableRows === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-plp-navy px-4 py-2 text-sm font-semibold text-white hover:bg-plp-navy-dark disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export to PLP Google Sheets Template
          </button>
        </div>
      </div>

      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-700">
          {notice}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-plp-slate-border bg-white px-6 py-16 text-center text-sm text-slate-500">
          No students match these filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-plp-slate-border bg-white shadow-sm">
          <table className="w-full min-w-3xl border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-plp-slate-border bg-plp-slate-surface text-xs uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-4 py-3 font-semibold">
                  Student
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Grade
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Honor societies
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Verified hours
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Task completion
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Verification
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr
                  key={entry.student.id}
                  className="border-b border-plp-slate-border align-top last:border-b-0"
                >
                  <td className="px-4 py-4">
                    <p className="font-semibold text-plp-navy">
                      {entry.student.fullName}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {entry.student.email}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-600">
                    {entry.student.gradeLevel ?? "—"}
                  </td>
                  <td className="px-4 py-4">
                    {entry.student.honorSocieties.length === 0 ? (
                      <span className="text-xs text-slate-400">None</span>
                    ) : (
                      <span className="flex flex-wrap gap-1.5">
                        {entry.student.honorSocieties.map((name) => (
                          <span
                            key={name}
                            className="whitespace-nowrap rounded-full bg-plp-slate-surface px-2.5 py-1 text-xs font-medium text-plp-navy ring-1 ring-inset ring-plp-slate-border"
                          >
                            {name}
                          </span>
                        ))}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <p className="text-sm font-semibold text-plp-navy">
                      {formatHourTotal(entry.verifiedHours)}
                    </p>
                    {entry.pendingHours > 0 ? (
                      <p className="mt-0.5 text-xs text-amber-700">
                        +{formatHourTotal(entry.pendingHours)} pending
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <CompletionFlag entry={entry} />
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[entry.verificationStatus]}`}
                    >
                      {VERIFICATION_LABELS[entry.verificationStatus]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
