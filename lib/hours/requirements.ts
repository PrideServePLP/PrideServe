import type { HonorSociety } from "@/lib/database.types";
import type { HourLog } from "./types";

/**
 * Service hour thresholds. Adjust these to match the current PLP handbook and
 * each chapter's bylaws; everything downstream reads from here.
 */
export const GRADUATION_HOURS_REQUIRED = 40;

export const SOCIETY_HOURS_REQUIRED: Record<HonorSociety, number> = {
  NHS: 25,
  NJHS: 15,
  "Beta Club": 20,
  "Spanish Honor Society": 10,
  "Science National Honor Society": 15,
};

export type ProgressTrack = {
  key: string;
  label: string;
  caption: string;
  verified: number;
  pending: number;
  required: number;
};

function sum(logs: HourLog[]): number {
  return logs.reduce((total, log) => total + log.hoursLogged, 0);
}

/**
 * Graduation counts every verified hour; each society counts only the hours
 * attributed to that chapter.
 */
export function buildProgressTracks(
  logs: HourLog[],
  honorSocieties: HonorSociety[],
): ProgressTrack[] {
  const verified = logs.filter((log) => log.status === "verified");
  const pending = logs.filter((log) => log.status === "pending");

  const graduation: ProgressTrack = {
    key: "graduation",
    label: "PLP graduation requirement",
    caption: "All verified service hours count toward graduation.",
    verified: sum(verified),
    pending: sum(pending),
    required: GRADUATION_HOURS_REQUIRED,
  };

  const societies = honorSocieties.map<ProgressTrack>((society) => ({
    key: society,
    label: society,
    caption: "Hours attributed to this chapter.",
    verified: sum(verified.filter((log) => log.honorSociety === society)),
    pending: sum(pending.filter((log) => log.honorSociety === society)),
    required: SOCIETY_HOURS_REQUIRED[society],
  }));

  return [graduation, ...societies];
}

export function percentComplete(track: ProgressTrack): number {
  if (track.required <= 0) {
    return 100;
  }
  return Math.min(100, Math.round((track.verified / track.required) * 100));
}
