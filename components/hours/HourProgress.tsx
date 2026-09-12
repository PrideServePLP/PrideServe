"use client";

import {
  percentComplete,
  type ProgressTrack,
} from "@/lib/hours/requirements";
import { formatHourCount, formatHourTotal } from "@/lib/hours/types";

function TrackCard({ track }: { track: ProgressTrack }) {
  const percent = percentComplete(track);
  const remaining = Math.max(0, track.required - track.verified);
  const complete = remaining === 0;

  return (
    <li className="rounded-xl border border-plp-slate-border bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-plp-navy">{track.label}</h3>
        <span
          className={`text-xs font-semibold ${complete ? "text-emerald-700" : "text-slate-500"}`}
        >
          {percent}%
        </span>
      </div>

      <p className="mt-2 text-2xl font-semibold text-plp-navy">
        {formatHourTotal(track.verified)}
        <span className="text-base font-medium text-slate-400">
          {" "}
          / {track.required} hrs
        </span>
      </p>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-plp-slate-surface"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${track.label} progress`}
      >
        <div
          className={`h-full rounded-full ${complete ? "bg-emerald-600" : "bg-plp-navy"}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        {complete
          ? "Requirement met."
          : `${formatHourCount(remaining)} remaining.`}
        {track.pending > 0
          ? ` ${formatHourCount(track.pending)} awaiting verification.`
          : ""}
      </p>
    </li>
  );
}

export default function HourProgress({ tracks }: { tracks: ProgressTrack[] }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-plp-navy">Progress</h2>
      <p className="text-sm text-slate-500">
        Only verified hours count toward a requirement.
      </p>
      <ul className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tracks.map((track) => (
          <TrackCard key={track.key} track={track} />
        ))}
      </ul>
    </section>
  );
}
