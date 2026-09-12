import type { OpportunityStatus } from "@/lib/database.types";
import { STATUS_LABELS } from "@/lib/tasks/types";

const STATUS_STYLES: Record<OpportunityStatus, string> = {
  pending_certification: "bg-amber-50 text-amber-800 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

export default function StatusBadge({
  status,
}: {
  status: OpportunityStatus;
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
