"use client";

import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import type { StudentOption } from "@/lib/tasks/types";
import { useStudentDirectory } from "@/lib/tasks/useTasks";

export default function StudentSelector({
  selected,
  onSelect,
}: {
  selected: StudentOption | null;
  onSelect: (student: StudentOption | null) => void;
}) {
  const students = useStudentDirectory();
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) {
      return students.slice(0, 5);
    }
    return students
      .filter(
        (student) =>
          student.fullName.toLowerCase().includes(needle) ||
          student.email.toLowerCase().includes(needle),
      )
      .slice(0, 8);
  }, [query, students]);

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-plp-navy bg-plp-navy/5 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-plp-navy">
            {selected.fullName}
          </p>
          <p className="truncate text-xs text-slate-500">
            {selected.email}
            {selected.gradeLevel ? ` · ${selected.gradeLevel}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelect(null);
            setQuery("");
          }}
          aria-label="Clear selected student"
          className="shrink-0 rounded p-1 text-slate-500 hover:bg-white hover:text-plp-navy"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search students by name or email"
          aria-label="Search students"
          className="w-full rounded-lg border border-plp-slate-border bg-plp-slate-surface py-2 pl-9 pr-3 text-sm outline-none ring-plp-navy focus:border-plp-navy focus:ring-2"
        />
      </div>

      <ul className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-plp-slate-border">
        {matches.length === 0 ? (
          <li className="px-3 py-3 text-sm text-slate-500">
            No students match “{query.trim()}”.
          </li>
        ) : (
          matches.map((student) => (
            <li key={student.id}>
              <button
                type="button"
                onClick={() => onSelect(student)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-plp-slate-surface"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-plp-navy">
                    {student.fullName}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {student.email}
                    {student.honorSocieties.length > 0
                      ? ` · ${student.honorSocieties.join(", ")}`
                      : ""}
                  </span>
                </span>
                <Check className="h-4 w-4 shrink-0 text-slate-300" />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
