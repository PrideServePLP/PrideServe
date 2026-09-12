"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import type { HonorSociety } from "@/lib/database.types";
import { HONOR_SOCIETIES } from "@/lib/onboarding";
import { HONOR_SOCIETY_SLUGS } from "@/lib/route-access";
import { useTaskViewer } from "@/lib/tasks/useTasks";
import { isSocietyMember } from "@/lib/tasks/visibility";

const SLUG_BY_SOCIETY = Object.fromEntries(
  Object.entries(HONOR_SOCIETY_SLUGS).map(([slug, society]) => [society, slug]),
) as Record<HonorSociety, string>;

export default function SocietyTabs() {
  const pathname = usePathname();
  const viewer = useTaskViewer();

  return (
    <nav
      aria-label="Honor societies"
      className="flex flex-wrap gap-2 border-b border-plp-slate-border pb-3"
    >
      {HONOR_SOCIETIES.map((society) => {
        const slug = SLUG_BY_SOCIETY[society];
        const href = `/honor-societies/${slug}`;
        const active = pathname === href;
        const unlocked = isSocietyMember(viewer, society);

        if (!unlocked) {
          return (
            <span
              key={society}
              aria-disabled="true"
              title={`You are not on the ${society} roster`}
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-dashed border-plp-slate-border bg-plp-slate-surface px-3 py-2 text-sm font-medium text-slate-400"
            >
              {society}
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                <Lock className="h-3 w-3" />
                Locked
              </span>
            </span>
          );
        }

        return (
          <Link
            key={society}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-plp-navy bg-plp-navy text-white"
                : "border-plp-slate-border bg-white text-plp-navy hover:border-plp-navy/40"
            }`}
          >
            {society}
          </Link>
        );
      })}
    </nav>
  );
}
