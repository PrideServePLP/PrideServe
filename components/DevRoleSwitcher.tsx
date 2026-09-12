"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";
import {
  DEV_PERSONA_LIST,
  DEV_ROLE_COOKIE,
  DEV_PERSONAS,
  type DevPersonaId,
} from "@/lib/dev-roles";

export default function DevRoleSwitcher({
  initialPersonaId,
}: {
  initialPersonaId: DevPersonaId | null;
}) {
  const [personaId, setPersonaId] = useState<DevPersonaId | "">(
    initialPersonaId ?? "",
  );

  const persona = personaId ? DEV_PERSONAS[personaId] : null;

  function applyPersona(next: DevPersonaId | "") {
    setPersonaId(next);
    document.cookie = next
      ? `${DEV_ROLE_COOKIE}=${next}; Path=/; Max-Age=86400; SameSite=Lax`
      : `${DEV_ROLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    // A full reload re-runs middleware so the current route is re-checked.
    window.location.reload();
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex h-10 items-center gap-3 bg-plp-navy-dark px-3 text-xs text-white">
      <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider">
        <FlaskConical className="h-3.5 w-3.5" />
        Dev
      </span>

      <label className="flex min-w-0 items-center gap-2">
        <span className="hidden text-white/70 sm:inline">Role context</span>
        <select
          value={personaId}
          onChange={(event) =>
            applyPersona(event.target.value as DevPersonaId | "")
          }
          className="rounded border border-white/20 bg-plp-navy px-2 py-1 text-xs text-white outline-none focus:border-white/60"
        >
          <option value="">Real session (no override)</option>
          {DEV_PERSONA_LIST.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <p className="truncate text-white/60">
        {persona
          ? `${persona.email} · role: ${persona.role}${
              persona.isTechManager ? " · tech manager" : ""
            }${
              persona.honorSocieties.length
                ? ` · ${persona.honorSocieties.join(", ")}`
                : ""
            }`
          : "Route guards use the signed-in Supabase profile."}
      </p>

      {persona ? (
        <button
          type="button"
          onClick={() => applyPersona("")}
          className="ml-auto shrink-0 rounded border border-white/20 px-2 py-1 hover:bg-white/10"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
