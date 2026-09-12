import Link from "next/link";
import {
  ClipboardCheck,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

const PORTAL_LINKS: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    href: "/admin/certification",
    icon: ShieldCheck,
    title: "Certification Queue",
    description:
      "Approve or reject internal and external service requests. Tech Managers and admins only.",
  },
  {
    href: "/admin/approvals",
    icon: ClipboardCheck,
    title: "Hour Verification",
    description:
      "Review student hour claims and approve them individually or in bulk.",
  },
  {
    href: "/admin/rosters",
    icon: Users,
    title: "Master Admin Roster",
    description:
      "School-wide student roster with verified hour totals and CSV export for the PLP tracking sheet.",
  },
];

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-plp-navy">
          School-wide settings
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-plp-navy">
          Admin &amp; Tech Manager Portal
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage rosters, certification, and platform configuration.
        </p>
      </div>

      <div className="space-y-4">
        {PORTAL_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-start gap-4 rounded-xl border border-plp-slate-border bg-white p-6 shadow-sm hover:border-plp-navy/40"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-plp-navy text-white">
                <Icon className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-base font-semibold text-plp-navy">
                  {link.title}
                </span>
                <span className="mt-1 block text-sm text-slate-500">
                  {link.description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
