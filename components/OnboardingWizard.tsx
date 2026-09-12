"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ONBOARDING_ROLES,
  SCHOOL_DOMAIN_ERROR,
  getDomainErrorForRole,
} from "@/lib/auth-domain";
import type { UserRole } from "@/lib/database.types";
import {
  CLASS_BLOCKS,
  GRADE_LEVELS,
  HONOR_SOCIETIES,
  type GradeLevel,
} from "@/lib/onboarding";
import { useAuth } from "@/components/AuthProvider";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { ClassBlock } from "@/lib/types";
import type { HonorSociety } from "@/lib/database.types";

export default function OnboardingWizard() {
  const router = useRouter();
  const { user, profile, refreshProfile, loading } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>(
    isAdmin
      ? "admin"
      : profile?.role && profile.role !== "admin"
        ? profile.role
        : "student",
  );
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [gradeLevel, setGradeLevel] = useState<GradeLevel | "">(
    (profile?.grade_level as GradeLevel | null) ?? "",
  );
  const [societies, setSocieties] = useState<HonorSociety[]>(
    (profile?.honor_societies as HonorSociety[] | undefined) ?? [],
  );
  const [blocks, setBlocks] = useState<ClassBlock[]>(
    (profile?.classes as ClassBlock[] | undefined) ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const studentSteps = role === "student" && !isAdmin;
  const totalSteps = isAdmin ? 1 : studentSteps ? 3 : 1;
  const currentStep = isAdmin ? 1 : step;

  const email = user?.email ?? profile?.email ?? "";

  const heading = useMemo(() => {
    if (isAdmin) {
      return "Confirm your admin profile";
    }
    if (currentStep === 1) {
      return "Select your primary role";
    }
    if (currentStep === 2) {
      return "Grade level & honor societies";
    }
    return "Enrolled class blocks";
  }, [currentStep, isAdmin]);

  async function finish() {
    setError(null);
    const selectedRole = isAdmin ? "admin" : role;
    const domainError = getDomainErrorForRole(email, selectedRole);
    if (domainError) {
      setError(domainError);
      return;
    }
    if (!fullName.trim()) {
      setError("Enter your full name.");
      return;
    }
    if (selectedRole === "student" && !gradeLevel) {
      setError("Select your grade level.");
      return;
    }
    if (!user) {
      setError("You need to be signed in to finish onboarding.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createSupabaseClient();
      const { error: rpcError } = await supabase.rpc("complete_onboarding", {
        p_role: selectedRole,
        p_full_name: fullName.trim(),
        p_grade_level: selectedRole === "student" ? gradeLevel : null,
        p_honor_societies: selectedRole === "student" ? societies : [],
        p_classes: selectedRole === "student" ? blocks : [],
      });

      if (rpcError) {
        setError(
          rpcError.message.toLowerCase().includes("@pinelakeprep.org")
            ? SCHOOL_DOMAIN_ERROR
            : rpcError.message,
        );
        return;
      }

      await refreshProfile();
      router.push("/");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function goNext() {
    setError(null);
    if (currentStep === 1) {
      if (email) {
        const domainError = getDomainErrorForRole(email, role);
        if (domainError) {
          setError(domainError);
          return;
        }
      }
      if (studentSteps) {
        setStep(2);
        return;
      }
      void finish();
      return;
    }
    if (currentStep === 2) {
      if (!gradeLevel) {
        setError("Select your grade level.");
        return;
      }
      setStep(3);
      return;
    }
    void finish();
  }

  if (loading) {
    return (
      <p className="text-sm text-slate-500">Loading your profile…</p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-wider text-plp-navy">
        Step {currentStep} of {totalSteps}
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-plp-navy">{heading}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Signed in as {email || "your account"}. School roles require a
        @pinelakeprep.org address.
      </p>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-plp-navy transition-all"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-plp-slate-border bg-white p-6 shadow-sm">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-slate-600">
            Full name
          </span>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-lg border border-plp-slate-border bg-plp-slate-surface px-3 py-2 text-sm outline-none ring-plp-navy focus:border-plp-navy focus:ring-2"
          />
        </label>

        {!isAdmin && currentStep === 1 ? (
          <fieldset className="mt-5">
            <legend className="text-sm font-medium text-slate-600">
              Primary role
            </legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {ONBOARDING_ROLES.map((option) => {
                const selected = role === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setRole(option.value);
                      setError(getDomainErrorForRole(email, option.value));
                    }}
                    className={`rounded-xl border px-4 py-3 text-left ${
                      selected
                        ? "border-plp-navy bg-plp-navy/5"
                        : "border-plp-slate-border hover:border-plp-navy/40"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-plp-navy">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        {currentStep === 2 && studentSteps ? (
          <div className="mt-5 space-y-5">
            <fieldset>
              <legend className="text-sm font-medium text-slate-600">
                Grade level
              </legend>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {GRADE_LEVELS.map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setGradeLevel(grade)}
                    className={`rounded-lg border px-3 py-2 text-center text-sm font-medium ${
                      gradeLevel === grade
                        ? "border-plp-navy bg-plp-navy text-white"
                        : "border-plp-slate-border text-plp-navy"
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-medium text-slate-600">
                Active honor societies
              </legend>
              <p className="mt-1 text-xs text-slate-500">
                Optional. Only enrolled members see honor-society tasks.
              </p>
              <div className="mt-3 space-y-2">
                {HONOR_SOCIETIES.map((society) => {
                  const checked = societies.includes(society);
                  return (
                    <label
                      key={society}
                      className="flex items-center gap-2 rounded-lg border border-plp-slate-border px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSocieties((current) =>
                            checked
                              ? current.filter((item) => item !== society)
                              : [...current, society],
                          );
                        }}
                      />
                      {society}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>
        ) : null}

        {currentStep === 3 && studentSteps ? (
          <fieldset className="mt-5">
            <legend className="text-sm font-medium text-slate-600">
              Class blocks
            </legend>
            <p className="mt-1 text-xs text-slate-500">
              Used to match peer tutoring and in-school tasks to your schedule.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {CLASS_BLOCKS.map((block) => {
                const selected = blocks.includes(block);
                return (
                  <button
                    key={block}
                    type="button"
                    onClick={() => {
                      setBlocks((current) =>
                        selected
                          ? current.filter((item) => item !== block)
                          : [...current, block],
                      );
                    }}
                    className={`rounded-lg border px-3 py-3 text-sm font-semibold ${
                      selected
                        ? "border-plp-navy bg-plp-navy text-white"
                        : "border-plp-slate-border text-plp-navy"
                    }`}
                  >
                    {block}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        <div className="mt-6 flex justify-between gap-3">
          <button
            type="button"
            disabled={currentStep === 1 || saving}
            onClick={() => {
              setError(null);
              setStep((value) => Math.max(1, value - 1));
            }}
            className="rounded-lg border border-plp-slate-border px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => goNext()}
            className="rounded-lg bg-plp-navy px-4 py-2 text-sm font-semibold text-white hover:bg-plp-navy-dark disabled:opacity-60"
          >
            {currentStep === totalSteps ? "Save and continue" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
