"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert, X } from "lucide-react";
import {
  ROUTE_GUARDS,
  denialMessage,
  type DenialReason,
} from "@/lib/route-access";

const REASONS: DenialReason[] = ["signin_required", "role", "society"];

export default function AccessNotice() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  const denied = searchParams.get("denied");
  const reason = searchParams.get("reason");
  const guard = ROUTE_GUARDS.find((item) => item.prefix === denied);

  if (dismissed || !guard || !REASONS.includes(reason as DenialReason)) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1">
        {denialMessage(
          guard.label,
          reason as DenialReason,
          searchParams.get("society"),
        )}
      </p>
      <button
        type="button"
        aria-label="Dismiss access notice"
        onClick={() => {
          setDismissed(true);
          router.replace(pathname || "/");
        }}
        className="rounded p-0.5 text-amber-700 hover:bg-amber-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
