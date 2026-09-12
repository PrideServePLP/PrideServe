import OrgRequestForm from "@/components/OrgRequestForm";
import OrgSubmissions from "@/components/OrgSubmissions";

export default function OrgDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-plp-navy">
          Partner organizations
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-plp-navy">
          Outside Org Portal
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Non-profits and community partners can post volunteer needs for Pine
          Lake Prep students here.
        </p>
      </div>

      <OrgRequestForm />
      <OrgSubmissions />
    </div>
  );
}
