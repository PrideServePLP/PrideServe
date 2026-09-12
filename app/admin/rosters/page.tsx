import Link from "next/link";
import RosterTable from "@/components/admin/RosterTable";
import { CSV_COLUMNS } from "@/lib/roster/csv";

export default function RostersPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href="/admin"
          className="text-xs font-medium text-plp-navy hover:underline"
        >
          ← Admin &amp; Tech Manager Portal
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-plp-navy">
          Master Admin Roster
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          Every student on the platform with their chapters, verified service
          hours, and task completion flags. Exports carry the current filters
          and match the PLP template columns: {CSV_COLUMNS.join(", ")}.
        </p>
      </div>

      <RosterTable />
    </div>
  );
}
