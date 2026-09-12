"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import type { OpportunityLocation } from "@/lib/database.types";
import { signUpForTask, signupKey } from "@/lib/tasks/store";
import { LOCATION_LABELS, type ServiceTask } from "@/lib/tasks/types";
import {
  useServiceTasks,
  useSignups,
  useTaskViewer,
} from "@/lib/tasks/useTasks";
import { publicFeedTasks } from "@/lib/tasks/visibility";
import type { ClassBlock } from "@/lib/types";
import AssignedTasks from "@/components/AssignedTasks";
import { useAuth } from "@/components/AuthProvider";
import TaskCard from "@/components/tasks/TaskCard";

const TIMES = ["All", "Morning", "After School"] as const;
const BLOCKS: Array<"All" | ClassBlock> = ["All", "A", "B", "C", "D", "E", "F"];
const LOCATIONS: Array<"All" | OpportunityLocation> = [
  "All",
  "in_school",
  "after_school",
  "out_of_school",
];

/** Time of day and class block both live in the free-text block_time column. */
function matchesTime(task: ServiceTask, time: (typeof TIMES)[number]) {
  if (time === "All") {
    return true;
  }
  return (task.blockTime ?? "").toLowerCase().includes(time.toLowerCase());
}

function matchesBlock(task: ServiceTask, block: (typeof BLOCKS)[number]) {
  if (block === "All") {
    return true;
  }
  return (task.blockTime ?? "").includes(`Block ${block}`);
}

export default function TaskFeed() {
  const tasks = useServiceTasks();
  const signups = useSignups();
  const viewer = useTaskViewer();
  const { profile, openAuthModal } = useAuth();
  const [query, setQuery] = useState("");
  const [time, setTime] = useState<(typeof TIMES)[number]>("All");
  const [block, setBlock] = useState<(typeof BLOCKS)[number]>("All");
  const [location, setLocation] = useState<(typeof LOCATIONS)[number]>("All");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);

  async function handleSignUp(task: ServiceTask) {
    setSignupError(null);

    if (!viewer) {
      openAuthModal("login");
      return;
    }

    if (viewer.role !== "student") {
      setSignupError("Only students can sign up for service opportunities.");
      return;
    }

    setPendingId(task.id);
    try {
      await signUpForTask(task, viewer.id, profile?.full_name ?? "A student");
    } catch (error) {
      setSignupError(
        error instanceof Error ? error.message : "Could not reserve your spot.",
      );
    } finally {
      setPendingId(null);
    }
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return publicFeedTasks(tasks).filter((task) => {
      const matchesQuery =
        needle.length === 0 ||
        task.title.toLowerCase().includes(needle) ||
        task.requestedBy.toLowerCase().includes(needle) ||
        task.description.toLowerCase().includes(needle);
      const matchesLocation = location === "All" || task.location === location;
      return (
        matchesQuery &&
        matchesTime(task, time) &&
        matchesBlock(task, block) &&
        matchesLocation
      );
    });
  }, [tasks, query, time, block, location]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-plp-navy">
          Public view
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-plp-navy">
          General Task Feed
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Browse open service opportunities without signing in. Sign up to
          reserve a spot; a full account is only needed when hours are verified.
        </p>
      </div>

      <AssignedTasks hideWhenEmpty />

      <section className="rounded-xl border border-plp-slate-border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500">
              Search by keyword
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Title, club, or description"
                className="w-full rounded-lg border border-plp-slate-border bg-plp-slate-surface py-2 pl-9 pr-3 text-sm outline-none ring-plp-navy focus:border-plp-navy focus:ring-2"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500">
              Filter by time
            </span>
            <select
              value={time}
              onChange={(event) =>
                setTime(event.target.value as (typeof TIMES)[number])
              }
              className="w-full rounded-lg border border-plp-slate-border bg-plp-slate-surface px-3 py-2 text-sm outline-none ring-plp-navy focus:border-plp-navy focus:ring-2"
            >
              {TIMES.map((option) => (
                <option key={option} value={option}>
                  {option === "All" ? "All times" : option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500">
              Filter by class block
            </span>
            <select
              value={block}
              onChange={(event) =>
                setBlock(event.target.value as (typeof BLOCKS)[number])
              }
              className="w-full rounded-lg border border-plp-slate-border bg-plp-slate-surface px-3 py-2 text-sm outline-none ring-plp-navy focus:border-plp-navy focus:ring-2"
            >
              {BLOCKS.map((option) => (
                <option key={option} value={option}>
                  {option === "All" ? "All blocks" : `Block ${option}`}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500">
              Filter by location
            </span>
            <select
              value={location}
              onChange={(event) =>
                setLocation(event.target.value as (typeof LOCATIONS)[number])
              }
              className="w-full rounded-lg border border-plp-slate-border bg-plp-slate-surface px-3 py-2 text-sm outline-none ring-plp-navy focus:border-plp-navy focus:ring-2"
            >
              {LOCATIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "All" ? "All locations" : LOCATION_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {signupError ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {signupError}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-plp-slate-border bg-white px-6 py-16 text-center text-sm text-slate-500">
          No opportunities match those filters. Try clearing a filter or
          searching a different keyword.
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {filtered.map((task) => {
            const isSignedUp = viewer
              ? signups.includes(signupKey(task.id, viewer.id))
              : false;
            return (
              <TaskCard
                key={task.id}
                task={task}
                footer={
                  <button
                    type="button"
                    disabled={isSignedUp || pendingId === task.id}
                    onClick={() => void handleSignUp(task)}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                      isSignedUp
                        ? "bg-slate-100 text-slate-500"
                        : "bg-plp-navy text-white hover:bg-plp-navy-dark"
                    }`}
                  >
                    {isSignedUp ? (
                      <>
                        <Check className="h-4 w-4" />
                        Signed up
                      </>
                    ) : (
                      "Sign Up"
                    )}
                  </button>
                }
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
