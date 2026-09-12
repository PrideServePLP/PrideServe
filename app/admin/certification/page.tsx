import Link from "next/link";
import CertificationQueue from "@/components/CertificationQueue";

export default function CertificationPage() {
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
          Certification Queue
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Review internal and external service requests. Certifying publishes
          the opportunity to the public task feed; rejecting returns it to the
          requester with your feedback.
        </p>
      </div>

      <CertificationQueue />
    </div>
  );
}
