import type { RosterEntry } from "./roster";

export const CSV_COLUMNS = [
  "Student Name",
  "Student Email",
  "Grade",
  "Honor Society",
  "Activity Name",
  "Hours Completed",
  "Supervisor Confirmation Flag",
  "Date Verified",
] as const;

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function sheetDate(iso: string | null): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return `${pad(date.getUTCMonth() + 1)}/${pad(date.getUTCDate())}/${date.getUTCFullYear()}`;
}

function escapeCell(value: string): string {
  const guarded = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export function buildCsv(entries: RosterEntry[]): string {
  const rows: string[][] = [[...CSV_COLUMNS]];

  entries.forEach((entry) => {
    const { student } = entry;
    entry.logs
      .filter((log) => log.status !== "rejected")
      .sort((a, b) => a.serviceDate.localeCompare(b.serviceDate))
      .forEach((log) => {
        rows.push([
          student.fullName,
          student.email,
          student.gradeLevel ?? "",
          log.honorSociety ?? "General",
          log.activityTitle,
          String(log.hoursLogged),
          log.supervisorConfirmed ? "Yes" : "No",
          sheetDate(log.status === "verified" ? log.reviewedAt : null),
        ]);
      });
  });

  return rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
}

export function countExportableRows(entries: RosterEntry[]): number {
  return entries.reduce(
    (total, entry) =>
      total + entry.logs.filter((log) => log.status !== "rejected").length,
    0,
  );
}

export function csvFileName(): string {
  const now = new Date();
  return `plp-service-hours-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.csv`;
}

export function downloadCsv(contents: string, fileName: string): void {
  const blob = new Blob([`\uFEFF${contents}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
