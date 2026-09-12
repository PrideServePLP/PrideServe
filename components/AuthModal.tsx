"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import {
  AUTH_ROLES,
  SCHOOL_DOMAIN_ERROR,
  getDomainErrorForRole,
  setIntendedRoleCookie,
} from "@/lib/auth-domain";
import type { UserRole } from "@/lib/database.types";
import {
  createSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

type AuthModalProps = {
  open: boolean;
  mode: "login" | "signup";
  banner: string | null;
  onModeChange: (mode: "login" | "signup") => void;
  onClose: () => void;
};

export default function AuthModal({
  open,
  mode,
  banner,
  onModeChange,
  onClose,
}: AuthModalProps) {
  const [role, setRole] = useState<UserRole>("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) {
    return null;
  }

  const alertMessage = error ?? banner;

  function validateDomain(nextEmail: string, nextRole: UserRole) {
    const domainError = getDomainErrorForRole(nextEmail, nextRole);
    if (domainError) {
      setError(domainError);
      return false;
    }
    return true;
  }

  async function handleEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (!validateDomain(email, role)) {
      return;
    }

    if (mode === "signup") {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!fullName.trim()) {
        setError("Enter your full name.");
        return;
      }
    }

    if (!isSupabaseConfigured()) {
      setError(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
      return;
    }

    setSubmitting(true);
    const supabase = createSupabaseClient();

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              intended_role: role,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) {
          setError(formatAuthError(signUpError.message));
          return;
        }
        setInfo(
          "Account created. Check your email if confirmation is required, then finish onboarding.",
        );
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError(formatAuthError(signInError.message));
          return;
        }
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setInfo(null);

    if (!isSupabaseConfigured()) {
      setError(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
      return;
    }

    setIntendedRoleCookie(role);
    setSubmitting(true);
    const supabase = createSupabaseClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (oauthError) {
      setSubmitting(false);
      setError(formatAuthError(oauthError.message));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-plp-navy/50"
        aria-label="Close authentication dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-md rounded-2xl border border-plp-slate-border bg-white p-6 shadow-xl"
      >
        <button
          type="button"
          className="absolute right-3 top-3 rounded-md p-1 text-slate-400 hover:bg-plp-slate-surface hover:text-plp-navy"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex rounded-lg bg-plp-slate-surface p-1">
          {(["login", "signup"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                onModeChange(value);
                setError(null);
                setInfo(null);
              }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize ${
                mode === value
                  ? "bg-white text-plp-navy shadow-sm"
                  : "text-slate-500"
              }`}
            >
              {value === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        <h2
          id="auth-modal-title"
          className="text-lg font-semibold text-plp-navy"
        >
          {mode === "login" ? "Welcome back" : "Create your PrideServe account"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          School roles require a @pinelakeprep.org email. Outside organizations
          may use any email.
        </p>

        {alertMessage ? (
          <div
            role="alert"
            className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{alertMessage}</p>
          </div>
        ) : null}

        {info ? (
          <p className="mt-4 rounded-lg border border-plp-slate-border bg-plp-slate-surface px-3 py-2 text-sm text-slate-600">
            {info}
          </p>
        ) : null}

        <form className="mt-4 space-y-3" onSubmit={handleEmailSubmit}>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-600">
              Role
            </span>
            <select
              required
              value={role}
              onChange={(event) => {
                const nextRole = event.target.value as UserRole;
                setRole(nextRole);
                if (email) {
                  setError(getDomainErrorForRole(email, nextRole));
                }
              }}
              className="w-full rounded-lg border border-plp-slate-border bg-plp-slate-surface px-3 py-2 text-sm outline-none ring-plp-navy focus:border-plp-navy focus:ring-2"
            >
              {AUTH_ROLES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {mode === "signup" ? (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-600">
                Full name
              </span>
              <input
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-lg border border-plp-slate-border bg-plp-slate-surface px-3 py-2 text-sm outline-none ring-plp-navy focus:border-plp-navy focus:ring-2"
              />
            </label>
          ) : null}

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-600">
              Email
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (event.target.value.includes("@")) {
                  setError(getDomainErrorForRole(event.target.value, role));
                } else {
                  setError(null);
                }
              }}
              placeholder={
                role === "outside_org"
                  ? "you@organization.org"
                  : "you@pinelakeprep.org"
              }
              className="w-full rounded-lg border border-plp-slate-border bg-plp-slate-surface px-3 py-2 text-sm outline-none ring-plp-navy focus:border-plp-navy focus:ring-2"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-600">
              Password
            </span>
            <input
              required
              type="password"
              value={password}
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-plp-slate-border bg-plp-slate-surface px-3 py-2 text-sm outline-none ring-plp-navy focus:border-plp-navy focus:ring-2"
            />
          </label>

          {mode === "signup" ? (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-600">
                Confirm password
              </span>
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-plp-slate-border bg-plp-slate-surface px-3 py-2 text-sm outline-none ring-plp-navy focus:border-plp-navy focus:ring-2"
              />
            </label>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-plp-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-plp-navy-dark disabled:opacity-60"
          >
            {mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
          <span className="h-px flex-1 bg-plp-slate-border" />
          or
          <span className="h-px flex-1 bg-plp-slate-border" />
        </div>

        <button
          type="button"
          disabled={submitting}
          onClick={() => void handleGoogle()}
          className="w-full rounded-lg border border-plp-slate-border px-4 py-2.5 text-sm font-semibold text-plp-navy hover:bg-plp-slate-surface disabled:opacity-60"
        >
          Continue with Google
        </button>
        <p className="mt-2 text-xs text-slate-400">
          Google accounts are checked against the selected role. School roles
          must use @pinelakeprep.org.
        </p>
      </div>
    </div>
  );
}

function formatAuthError(message: string) {
  if (message.toLowerCase().includes("@pinelakeprep.org")) {
    return SCHOOL_DOMAIN_ERROR;
  }
  return message;
}
