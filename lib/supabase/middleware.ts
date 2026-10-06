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

const AUTH_LOOKUP_TIMEOUT_MS = 2000;

function readDevAccessProfile(request: NextRequest): AccessProfile | null {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }
  const persona = getDevPersona(request.cookies.get(DEV_ROLE_COOKIE)?.value);
  return persona ? devPersonaToAccessProfile(persona) : null;
}

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(
      ({ name }) => name.includes("auth-token") || name.startsWith("sb-"),
    );
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("supabase_middleware_timeout")), ms);
    }),
  ]);
}

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

function signedOutResponse(
  request: NextRequest,
  response: NextResponse,
  devProfile: AccessProfile | null,
) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/auth")) {
    return response;
  }

  if (path.startsWith("/onboarding")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("authError", "signin_required");
    return NextResponse.redirect(redirectUrl);
  }

  return guardRoute(request, devProfile) ?? response;
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const devProfile = readDevAccessProfile(request);

  let response = NextResponse.next({ request });

  if (!url || !anonKey) {
    return guardRoute(request, devProfile) ?? response;
  }

  if (!hasSupabaseAuthCookie(request)) {
    return signedOutResponse(request, response, devProfile);
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

  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/auth");
  const isOnboarding = path.startsWith("/onboarding");

  try {
    const session = await withTimeout(
      (async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || isAuthRoute) {
          return { user, profile: null };
        }

        const { data: profile } = await supabase
          .from("users")
          .select("role, is_tech_manager, honor_societies, onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();

        return { user, profile };
      })(),
      AUTH_LOOKUP_TIMEOUT_MS,
    );

    const { user, profile } = session;

    if (isAuthRoute) {
      return response;
    }

    if (!user) {
      return signedOutResponse(request, response, devProfile);
    }

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

    const accessProfile: AccessProfile = devProfile ?? {
      role: profile.role,
      isTechManager: profile.is_tech_manager,
      honorSocieties: profile.honor_societies ?? [],
    };

    return guardRoute(request, accessProfile) ?? response;
  } catch {
    return signedOutResponse(request, response, devProfile);
  }
}
