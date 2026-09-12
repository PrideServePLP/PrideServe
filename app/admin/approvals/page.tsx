import Link from "next/link";
import ApprovalsTable from "@/components/hours/ApprovalsTable";

export default function ApprovalsPage() {
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
          Hour Verification
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Review student hour claims. Select several rows to approve or reject
          them together; students are notified of every decision.
        </p>
      </div>

      <ApprovalsTable />
    </div>
  );
}
