import type { HourLogStatus } from "@/lib/database.types";
import { HOUR_STATUS_LABELS } from "@/lib/hours/types";

const STATUS_STYLES: Record<HourLogStatus, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  verified: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

export default function HourStatusBadge({
  status,
}: {
  status: HourLogStatus;
}) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {HOUR_STATUS_LABELS[status]}
    </span>
  );
}
