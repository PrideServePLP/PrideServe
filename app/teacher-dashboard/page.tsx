import PostedRequests from "@/components/PostedRequests";
import PrivateRequestForm from "@/components/PrivateRequestForm";

export default function TeacherDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-plp-navy">
          Staff workspace
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-plp-navy">
          Teacher / Advisor Dashboard
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Post opportunities for the whole school or send a private service
          request straight to one student.
        </p>
      </div>

      <PrivateRequestForm />
      <PostedRequests />
    </div>
  );
}
