import { NextResponse } from "next/server";
import {
  getDomainErrorForRole,
  INTENDED_ROLE_COOKIE,
} from "@/lib/auth-domain";
import type { UserRole } from "@/lib/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const AUTH_ROLES: UserRole[] = [
  "student",
  "ta",
  "teacher",
  "admin",
  "outside_org",
];

function isUserRole(value: string | undefined): value is UserRole {
  return !!value && AUTH_ROLES.includes(value as UserRole);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  const fail = (codeName: string) => {
    const url = new URL("/", origin);
    url.searchParams.set("authError", codeName);
    return NextResponse.redirect(url);
  };

  if (!isSupabaseConfigured()) {
    return fail("not_configured");
  }

  if (!code) {
    return fail("oauth");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return fail("oauth");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieHeader = request.headers.get("cookie") ?? "";
  const intended = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${INTENDED_ROLE_COOKIE}=`))
    ?.split("=")[1];

  const role = isUserRole(intended) ? intended : undefined;
  const domainError = role
    ? getDomainErrorForRole(user?.email ?? "", role)
    : null;

  if (domainError) {
    await supabase.auth.signOut();
    return fail("school_domain");
  }

  const redirectResponse = NextResponse.redirect(new URL(next, origin));
  redirectResponse.cookies.set(INTENDED_ROLE_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });
  return redirectResponse;
}
