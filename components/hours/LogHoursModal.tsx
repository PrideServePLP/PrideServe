"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import type { HonorSociety } from "@/lib/database.types";
import { createHourLog } from "@/lib/hours/store";
import { useServiceTasks, useTaskViewer } from "@/lib/tasks/useTasks";
import { useAuth } from "@/components/AuthProvider";

const fieldClass =
  "w-full rounded-lg border border-plp-slate-border bg-plp-slate-surface px-3 py-2 text-sm outline-none ring-plp-navy focus:border-plp-navy focus:ring-2";
const labelClass = "mb-1.5 block text-xs font-medium text-slate-500";

const MANUAL = "manual";

export default function LogHoursModal({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth();
  const viewer = useTaskViewer();
  const tasks = useServiceTasks();

  const [opportunityId, setOpportunityId] = useState<string>(MANUAL);
  const [activityTitle, setActivityTitle] = useState("");
  const [society, setSociety] = useState<string>("");
  const [serviceDate, setServiceDate] = useState("");
  const [hours, setHours] = useState("1");
  const [proofNotes, setProofNotes] = useState("");
  const [proofPhotoUrl, setProofPhotoUrl] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorEmail, setSupervisorEmail] = useState("");
  const [supervisorPhone, setSupervisorPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const linkable = tasks.filter((task) => task.status === "approved");
  const selectedTask =
    opportunityId === MANUAL
      ? null
      : (linkable.find((task) => task.id === opportunityId) ?? null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!viewer || viewer.role !== "student") {
      setError("Only students can log service hours.");
      return;
    }

    const hoursValue = Number(hours);
    if (!Number.isFinite(hoursValue) || hoursValue <= 0) {
      setError("Enter an hour value greater than zero.");
      return;
    }

    const title = selectedTask?.title ?? activityTitle.trim();
    if (title === "") {
      setError("Describe what you did, or pick a task from the list.");
      return;
    }

    if (supervisorName.trim() === "" || supervisorEmail.trim() === "") {
      setError("A supervisor name and email are required for verification.");
      return;
    }

    setSaving(true);
    try {
      await createHourLog({
        studentId: viewer.id,
        studentName: profile?.full_name ?? "Student",
        opportunityId: selectedTask?.id ?? null,
        activityTitle: title,
        honorSociety:
          (selectedTask?.honorSociety ??
            (society === "" ? null : (society as HonorSociety))) ?? null,
        serviceDate: `${serviceDate}T12:00:00.000Z`,
        hoursLogged: hoursValue,
        reflectionText: proofNotes.trim() === "" ? null : proofNotes.trim(),
        proofPhotoUrl:
          proofPhotoUrl.trim() === "" ? null : proofPhotoUrl.trim(),
        supervisorName: supervisorName.trim(),
        supervisorEmail: supervisorEmail.trim(),
        supervisorPhone:
          supervisorPhone.trim() === "" ? null : supervisorPhone.trim(),
      });
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save the hour log.",
      );
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-plp-navy/40 p-4 py-10">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-hours-title"
        className="w-full max-w-2xl rounded-xl border border-plp-slate-border bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-plp-slate-border px-6 py-4">
          <div>
            <h2
              id="log-hours-title"
              className="text-lg font-semibold text-plp-navy"
            >
              Log service hours
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Submissions go to your teacher or advisor for verification.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-slate-500 hover:bg-plp-slate-surface"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className={labelClass}>Activity</span>
              <select
                value={opportunityId}
                onChange={(event) => setOpportunityId(event.target.value)}
                className={fieldClass}
              >
                <option value={MANUAL}>
                  Other activity (not from the task feed)
                </option>
                {linkable.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title} — {task.requestedBy}
                  </option>
                ))}
              </select>
            </label>

            {selectedTask ? null : (
              <>
                <label>
                  <span className={labelClass}>What did you do?</span>
                  <input
                    required
                    value={activityTitle}
                    onChange={(event) => setActivityTitle(event.target.value)}
                    placeholder="Shoreline cleanup with my neighborhood"
                    className={fieldClass}
                  />
                </label>

                <label>
                  <span className={labelClass}>
                    Count toward (optional chapter)
                  </span>
                  <select
                    value={society}
                    onChange={(event) => setSociety(event.target.value)}
                    className={fieldClass}
                  >
                    <option value="">Graduation hours only</option>
                    {(viewer?.honorSocieties ?? []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}

            <label>
              <span className={labelClass}>Date served</span>
              <input
                required
                type="date"
                value={serviceDate}
                onChange={(event) => setServiceDate(event.target.value)}
                className={fieldClass}
              />
            </label>

            <label>
              <span className={labelClass}>Hours served</span>
              <input
                required
                type="number"
                min="0.25"
                step="0.25"
                value={hours}
                onChange={(event) => setHours(event.target.value)}
                className={fieldClass}
              />
            </label>

            <label className="md:col-span-2">
              <span className={labelClass}>Proof notes</span>
              <textarea
                rows={3}
                value={proofNotes}
                onChange={(event) => setProofNotes(event.target.value)}
                placeholder="What you did, who you worked with, and anything your supervisor should confirm."
                className={fieldClass}
              />
            </label>

            <label className="md:col-span-2">
              <span className={labelClass}>Proof photo link (optional)</span>
              <input
                type="url"
                value={proofPhotoUrl}
                onChange={(event) => setProofPhotoUrl(event.target.value)}
                placeholder="https://photos.example.com/service-day.jpg"
                className={fieldClass}
              />
            </label>
          </div>

          <fieldset className="mt-5 rounded-lg border border-plp-slate-border p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Supervisor contact
            </legend>
            <div className="grid gap-4 md:grid-cols-3">
              <label>
                <span className={labelClass}>Name</span>
                <input
                  required
                  value={supervisorName}
                  onChange={(event) => setSupervisorName(event.target.value)}
                  placeholder="Dana Whitfield"
                  className={fieldClass}
                />
              </label>
              <label>
                <span className={labelClass}>Email</span>
                <input
                  required
                  type="email"
                  value={supervisorEmail}
                  onChange={(event) => setSupervisorEmail(event.target.value)}
                  placeholder="dana@partner.org"
                  className={fieldClass}
                />
              </label>
              <label>
                <span className={labelClass}>Phone (optional)</span>
                <input
                  value={supervisorPhone}
                  onChange={(event) => setSupervisorPhone(event.target.value)}
                  placeholder="704-555-0142"
                  className={fieldClass}
                />
              </label>
            </div>
          </fieldset>

          {error ? (
            <p role="alert" className="mt-4 text-sm font-medium text-red-600">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-plp-slate-border px-4 py-2 text-sm font-semibold text-plp-navy hover:bg-plp-slate-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-plp-navy px-4 py-2 text-sm font-semibold text-white hover:bg-plp-navy-dark disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit for verification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
