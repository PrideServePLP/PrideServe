/** Stable-enough client id for demo records created before Supabase is wired up. */
export function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}
