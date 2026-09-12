import AssignedTasks from "@/components/AssignedTasks";
import StudentHours from "@/components/hours/StudentHours";

export default function MyHoursPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-plp-navy">
          My dashboard
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-plp-navy">
          My Hour History
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Track verified hours against your graduation and honor society
          requirements, and submit new service for verification.
        </p>
      </div>

      <AssignedTasks hideWhenEmpty />
      <StudentHours />
    </div>
  );
}
