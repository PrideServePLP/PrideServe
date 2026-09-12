"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import type {
  HonorSociety,
  OpportunityCategory,
  OpportunityLocation,
  ServiceScope,
} from "@/lib/database.types";
import { HONOR_SOCIETIES } from "@/lib/onboarding";
import { createTask } from "@/lib/tasks/store";
import {
  LOCATION_OPTIONS,
  SCOPE_OPTIONS,
  type StudentOption,
} from "@/lib/tasks/types";
import { useTaskViewer } from "@/lib/tasks/useTasks";
import { isStaffViewer } from "@/lib/tasks/visibility";
import StudentSelector from "@/components/StudentSelector";
import { useAuth } from "@/components/AuthProvider";

const CATEGORIES: OpportunityCategory[] = [
  "General",
  "Tutoring",
  "NHS",
  "Beta",
  "Outside Org",
];

const fieldClass =
  "w-full rounded-lg border border-plp-slate-border bg-plp-slate-surface px-3 py-2 text-sm outline-none ring-plp-navy focus:border-plp-navy focus:ring-2";
const labelClass = "mb-1.5 block text-xs font-medium text-slate-500";

export default function PrivateRequestForm() {
  const { profile } = useAuth();
  const viewer = useTaskViewer();
  const staff = isStaffViewer(viewer);

  const [isPrivate, setIsPrivate] = useState(true);
  const [student, setStudent] = useState<StudentOption | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<OpportunityCategory>("General");
  const [society, setSociety] = useState<HonorSociety | "">("");
  const [scope, setScope] = useState<ServiceScope>("community_external");
  const [location, setLocation] = useState<OpportunityLocation>("in_school");
  const [eventDate, setEventDate] = useState("");
  const [blockTime, setBlockTime] = useState("");
  const [hours, setHours] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!viewer || !profile) {
      setError("Sign in as a teacher or advisor to post a request.");
      return;
    }
    if (isPrivate && !student) {
      setError("Search for and select the student this request is for.");
      return;
    }
    if (scope === "club_internal" && !society) {
      setError("Internal club service must be tied to an honor society.");
      return;
    }
    const hoursValue = Number(hours);
    if (!Number.isFinite(hoursValue) || hoursValue <= 0) {
      setError("Enter an hour value greater than zero.");
      return;
    }

    setSaving(true);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim(),
        requestedBy: profile.full_name || "Pine Lake Prep",
        category,
        honorSociety: society === "" ? null : society,
        serviceScope: scope,
        location,
        eventDate: `${eventDate}T12:00:00.000Z`,
        blockTime: blockTime.trim() === "" ? null : blockTime.trim(),
        hoursValue,
        createdBy: viewer.id,
        assignedStudentId: isPrivate && student ? student.id : null,
      });

      setSuccess(
        isPrivate && student
          ? `Private request sent to ${student.fullName}. It appears only on their feed.`
          : "Opportunity posted to the public task feed.",
      );
      setTitle("");
      setDescription("");
      setBlockTime("");
      setEventDate("");
      setHours("1");
      setStudent(null);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save the request.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!staff) {
    return (
      <div className="rounded-xl border border-plp-slate-border bg-white p-6 text-sm text-slate-600 shadow-sm">
        Only teachers, TAs, advisors, and admins can post service requests.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-plp-slate-border bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-plp-navy">
        Post a service request
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Public requests appear on the General Task Feed. Private requests are
        delivered to one student only.
      </p>

      <fieldset className="mt-5">
        <legend className={labelClass}>Visibility</legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsPrivate(false)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              !isPrivate
                ? "border-plp-navy bg-plp-navy text-white"
                : "border-plp-slate-border text-plp-navy"
            }`}
          >
            Public opportunity
          </button>
          <button
            type="button"
            onClick={() => setIsPrivate(true)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              isPrivate
                ? "border-plp-navy bg-plp-navy text-white"
                : "border-plp-slate-border text-plp-navy"
            }`}
          >
            Private assignment
          </button>
        </div>
      </fieldset>

      {isPrivate ? (
        <div className="mt-4">
          <span className={labelClass}>Assign to student</span>
          <StudentSelector selected={student} onSelect={setStudent} />
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="md:col-span-2">
          <span className={labelClass}>Title</span>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Biology lab inventory audit"
            className={fieldClass}
          />
        </label>

        <label className="md:col-span-2">
          <span className={labelClass}>Description</span>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What the student will do, and who to report to."
            className={fieldClass}
          />
        </label>

        <label>
          <span className={labelClass}>Category</span>
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as OpportunityCategory)
            }
            className={fieldClass}
          >
            {CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>Honor society (optional)</span>
          <select
            value={society}
            onChange={(event) =>
              setSociety(event.target.value as HonorSociety | "")
            }
            className={fieldClass}
          >
            <option value="">Not society-specific</option>
            {HONOR_SOCIETIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>Hour type</span>
          <select
            value={scope}
            onChange={(event) =>
              setScope(event.target.value as ServiceScope)
            }
            className={fieldClass}
          >
            {SCOPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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

        <label>
          <span className={labelClass}>Date</span>
          <input
            required
            type="date"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
            className={fieldClass}
          />
        </label>

        <label>
          <span className={labelClass}>Block or time (optional)</span>
          <input
            value={blockTime}
            onChange={(event) => setBlockTime(event.target.value)}
            placeholder="Block C"
            className={fieldClass}
          />
        </label>

        <label>
          <span className={labelClass}>Verified hours</span>
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
        {isPrivate ? "Send private request" : "Post opportunity"}
      </button>
    </form>
  );
}
