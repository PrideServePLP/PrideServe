"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import type {
  OpportunityLocation,
  RecurrencePattern,
} from "@/lib/database.types";
import { createTask } from "@/lib/tasks/store";
import {
  LOCATION_OPTIONS,
  RECURRENCE_OPTIONS,
} from "@/lib/tasks/types";
import { useTaskViewer } from "@/lib/tasks/useTasks";
import { useAuth } from "@/components/AuthProvider";

const fieldClass =
  "w-full rounded-lg border border-plp-slate-border bg-plp-slate-surface px-3 py-2 text-sm outline-none ring-plp-navy focus:border-plp-navy focus:ring-2";
const labelClass = "mb-1.5 block text-xs font-medium text-slate-500";

export default function OrgRequestForm() {
  const { profile } = useAuth();
  const viewer = useTaskViewer();

  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState(profile?.full_name ?? "");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [blockTime, setBlockTime] = useState("");
  const [volunteers, setVolunteers] = useState("5");
  const [hours, setHours] = useState("2");
  const [location, setLocation] =
    useState<OpportunityLocation>("out_of_school");
  const [recurring, setRecurring] = useState(false);
  const [pattern, setPattern] = useState<RecurrencePattern>("weekly");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!viewer) {
      setError("Sign in with your organization account to submit a request.");
      return;
    }

    const volunteersValue = Number(volunteers);
    const hoursValue = Number(hours);
    if (!Number.isInteger(volunteersValue) || volunteersValue <= 0) {
      setError("Required volunteers must be a whole number above zero.");
      return;
    }
    if (!Number.isFinite(hoursValue) || hoursValue <= 0) {
      setError("Enter an hour value greater than zero.");
      return;
    }

    setSaving(true);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim(),
        requestedBy: organization.trim(),
        organizationName: organization.trim(),
        category: "Outside Org",
        honorSociety: null,
        serviceScope: "community_external",
        location,
        eventDate: `${eventDate}T12:00:00.000Z`,
        blockTime: blockTime.trim() === "" ? null : blockTime.trim(),
        hoursValue,
        requiredVolunteers: volunteersValue,
        createdBy: viewer.id,
        assignedStudentId: null,
        recurrencePattern: recurring ? pattern : null,
        status: "pending_certification",
      });

      setSuccess(
        "Request submitted. A Tech Manager will certify it before it reaches the public task feed.",
      );
      setTitle("");
      setDescription("");
      setEventDate("");
      setBlockTime("");
      setVolunteers("5");
      setHours("2");
      setRecurring(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit the request.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-plp-slate-border bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-plp-navy">
        Submit a volunteer request
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Every submission starts as <strong>pending certification</strong>. A
        Pine Lake Prep Tech Manager reviews it before students can sign up.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label>
          <span className={labelClass}>Title</span>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Habitat build day — framing crew"
            className={fieldClass}
          />
        </label>

        <label>
          <span className={labelClass}>Organization name</span>
          <input
            required
            value={organization}
            onChange={(event) => setOrganization(event.target.value)}
            placeholder="Habitat for Humanity Lake Norman"
            className={fieldClass}
          />
        </label>

        <label className="md:col-span-2">
          <span className={labelClass}>Detailed description</span>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What volunteers will do, supervision provided, age or safety requirements, and where to report."
            className={fieldClass}
          />
        </label>

        <label>
          <span className={labelClass}>Event date</span>
          <input
            required
            type="date"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
            className={fieldClass}
          />
        </label>

        <label>
          <span className={labelClass}>Block / time details</span>
          <input
            value={blockTime}
            onChange={(event) => setBlockTime(event.target.value)}
            placeholder="8:00 AM – 1:00 PM"
            className={fieldClass}
          />
        </label>

        <label>
          <span className={labelClass}>Required volunteers</span>
          <input
            required
            type="number"
            min="1"
            step="1"
            value={volunteers}
            onChange={(event) => setVolunteers(event.target.value)}
            className={fieldClass}
          />
        </label>

        <label>
          <span className={labelClass}>Service hours per volunteer</span>
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

        <label>
          <span className={labelClass}>Location</span>
          <select
            value={location}
            onChange={(event) =>
              setLocation(event.target.value as OpportunityLocation)
            }
            className={fieldClass}
          >
            {LOCATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className={labelClass}>Recurring event</span>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-plp-navy">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(event) => setRecurring(event.target.checked)}
                className="h-4 w-4 rounded border-plp-slate-border text-plp-navy"
              />
              Repeats
            </label>
            <select
              value={pattern}
              disabled={!recurring}
              aria-label="Recurrence frequency"
              onChange={(event) =>
                setPattern(event.target.value as RecurrencePattern)
              }
              className={`${fieldClass} disabled:opacity-50`}
            >
              {RECURRENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="mt-4 text-sm font-medium text-emerald-700">
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-plp-navy px-4 py-2 text-sm font-semibold text-white hover:bg-plp-navy-dark disabled:opacity-60"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Submit for certification
      </button>
    </form>
  );
}
