import { cookies } from "next/headers";
import { DEV_ROLE_COOKIE, isDevPersonaId, type DevPersonaId } from "./dev-roles";

export function isDevToolbarEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

export async function readDevPersonaId(): Promise<DevPersonaId | null> {
  if (!isDevToolbarEnabled()) {
    return null;
  }
  const store = await cookies();
  const value = store.get(DEV_ROLE_COOKIE)?.value;
  return isDevPersonaId(value) ? value : null;
}
