import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "../database.types";
import {
  DEV_ROLE_COOKIE,
  devPersonaToAccessProfile,
  getDevPersona,
} from "../dev-roles";
import {
  evaluateRouteAccess,
  honorSocietyForPath,
  matchRouteGuard,
  type AccessProfile,
} from "../route-access";

function readDevAccessProfile(request: NextRequest): AccessProfile | null {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }
  const persona = getDevPersona(request.cookies.get(DEV_ROLE_COOKIE)?.value);
  return persona ? devPersonaToAccessProfile(persona) : null;
}

/** Redirects to the public feed when the profile cannot open the requested route. */
function guardRoute(
  request: NextRequest,
  profile: AccessProfile | null,
): NextResponse | null {
  const path = request.nextUrl.pathname;
  const guard = matchRouteGuard(path);
  if (!guard) {
    return null;
  }

  const denial = evaluateRouteAccess(guard, profile, path);
  if (!denial) {
    return null;
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("denied", guard.prefix);
  redirectUrl.searchParams.set("reason", denial);

  const society = honorSocietyForPath(path);
  if (denial === "society" && society) {
    redirectUrl.searchParams.set("society", society);
  }
  if (denial === "signin_required") {
    redirectUrl.searchParams.set("authError", "signin_required");
  }
  return NextResponse.redirect(redirectUrl);
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const devProfile = readDevAccessProfile(request);

  let response = NextResponse.next({ request });

  if (!url || !anonKey) {
    return guardRoute(request, devProfile) ?? response;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/auth");
  const isOnboarding = path.startsWith("/onboarding");

  if (isAuthRoute) {
    return response;
  }

  if (!user) {
    if (isOnboarding) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      redirectUrl.search = "";
      redirectUrl.searchParams.set("authError", "signin_required");
      return NextResponse.redirect(redirectUrl);
    }
    return guardRoute(request, devProfile) ?? response;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, is_tech_manager, honor_societies, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) {
    if (isOnboarding) {
      return response;
    }
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/onboarding";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (isOnboarding) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  // A dev persona overrides the signed-in profile so guards can be exercised locally.
  const accessProfile: AccessProfile = devProfile ?? {
    role: profile.role,
    isTechManager: profile.is_tech_manager,
    honorSocieties: profile.honor_societies ?? [],
  };

  return guardRoute(request, accessProfile) ?? response;
}
