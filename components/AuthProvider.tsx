"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import type { UserRow } from "@/lib/database.types";
import {
  DEV_ROLE_COOKIE,
  devPersonaToProfileRow,
  getDevPersona,
  type DevPersonaId,
} from "@/lib/dev-roles";
import {
  createSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import AuthModal from "@/components/AuthModal";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  school_domain:
    "School roles (student, teacher, TA, and admin) must use an email that ends with @pinelakeprep.org.",
  oauth: "Google sign-in did not complete. Please try again.",
  not_configured: "Supabase is not configured yet.",
  signin_required: "Sign in to continue.",
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: UserRow | null;
  isSignedIn: boolean;
  devPersonaId: DevPersonaId | null;
  loading: boolean;
  configured: boolean;
  openAuthModal: (mode?: "login" | "signup") => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}

export default function AuthProvider({
  children,
  devPersonaId = null,
}: {
  children: React.ReactNode;
  devPersonaId?: DevPersonaId | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const configured = isSupabaseConfigured();
  const authError = searchParams.get("authError");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(configured);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "signup">("login");
  const [banner, setBanner] = useState<string | null>(null);
  const [dismissedQueryError, setDismissedQueryError] = useState(false);

  const queryBanner =
    !dismissedQueryError && authError
      ? (AUTH_ERROR_MESSAGES[authError] ?? "Sign-in was rejected.")
      : null;
  const alertBanner = banner ?? queryBanner;

  const refreshProfile = useCallback(async () => {
    if (!configured) {
      setProfile(null);
      return;
    }
    const supabase = createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    setProfile(data);
  }, [configured]);

  useEffect(() => {
    if (!configured) {
      return;
    }

    const supabase = createSupabaseClient();

    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        const { data: row } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.session.user.id)
          .maybeSingle();
        setProfile(row);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession?.user) {
        setProfile(null);
        return;
      }
      void supabase
        .from("users")
        .select("*")
        .eq("id", nextSession.user.id)
        .maybeSingle()
        .then(({ data }) => setProfile(data));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured]);

  const openAuthModal = useCallback((mode: "login" | "signup" = "login") => {
    setBanner(null);
    setModalMode(mode);
    setModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setModalOpen(false);
    setBanner(null);
    setDismissedQueryError(true);
    if (authError) {
      router.replace(pathname || "/");
    }
  }, [authError, pathname, router]);

  const signOut = useCallback(async () => {
    if (configured) {
      await createSupabaseClient().auth.signOut();
    }
    document.cookie = `${DEV_ROLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    setSession(null);
    setProfile(null);
    router.push("/");
    router.refresh();
  }, [configured, router]);

  const value = useMemo<AuthContextValue>(() => {
    const devPersona = getDevPersona(devPersonaId);
    const effectiveProfile =
      profile ?? (devPersona ? devPersonaToProfileRow(devPersona) : null);

    return {
      session,
      user: session?.user ?? null,
      profile: effectiveProfile,
      isSignedIn: Boolean(session?.user) || Boolean(devPersona),
      devPersonaId,
      loading,
      configured,
      openAuthModal,
      signOut,
      refreshProfile,
    };
  }, [
    configured,
    devPersonaId,
    loading,
    openAuthModal,
    profile,
    refreshProfile,
    session,
    signOut,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        open={modalOpen || Boolean(queryBanner)}
        mode={modalMode}
        banner={alertBanner}
        onModeChange={setModalMode}
        onClose={closeAuthModal}
      />
    </AuthContext.Provider>
  );
}
