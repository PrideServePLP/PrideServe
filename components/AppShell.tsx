"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, LogOut, Menu, X } from "lucide-react";
import { navItems } from "@/lib/nav";
import AccessNotice from "@/components/AccessNotice";
import { useAuth } from "@/components/AuthProvider";
import NotificationBell from "@/components/NotificationBell";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, isSignedIn, openAuthModal, signOut } = useAuth();
  const isOnboarding = pathname.startsWith("/onboarding");

  const sidebarWidth = collapsed ? "md:w-20" : "md:w-72";
  const initials = (profile?.full_name || profile?.email || "GS")
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "GS";

  return (
    <div className="flex min-h-full bg-plp-slate-surface">
      {isOnboarding ? null : mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="fixed inset-0 z-30 bg-plp-navy/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {isOnboarding ? null : (
      <aside
        className={`app-sidebar fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/10 bg-plp-navy text-white transition-all duration-200 ${
          mobileOpen ? "w-72 translate-x-0" : "-translate-x-full w-72"
        } md:translate-x-0 ${sidebarWidth}`}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-white/10 px-4">
          {!collapsed || mobileOpen ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-wide">
                PrideServe
              </p>
              <p className="truncate text-xs text-white/70">Pine Lake Prep</p>
            </div>
          ) : (
            <span className="mx-auto text-sm font-bold">PS</span>
          )}
          <button
            type="button"
            className="hidden rounded-md p-1.5 text-white/80 hover:bg-white/10 md:inline-flex"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
          <button
            type="button"
            className="rounded-md p-1.5 text-white/80 hover:bg-white/10 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={item.label}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-white text-plp-navy"
                    : "text-white/85 hover:bg-white/10"
                } ${collapsed ? "md:justify-center md:px-2" : ""}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span
                  className={`min-w-0 ${collapsed ? "md:hidden" : "block"}`}
                >
                  <span className="block truncate font-medium">{item.label}</span>
                  <span
                    className={`block truncate text-xs ${
                      active ? "text-plp-navy/70" : "text-white/60"
                    }`}
                  >
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
      )}

      <div
        className={`flex min-h-full min-w-0 flex-1 flex-col transition-[padding] duration-200 ${
          isOnboarding ? "" : collapsed ? "md:pl-20" : "md:pl-72"
        }`}
      >
        <header className="app-header sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-plp-slate-border bg-white px-4">
          <div className="flex min-w-0 items-center gap-3">
            {isOnboarding ? null : (
              <button
                type="button"
                className="rounded-md p-2 text-plp-navy hover:bg-plp-slate-surface md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-plp-navy">
                Pine Lake Preparatory
              </p>
              <p className="truncate text-xs text-slate-500">
                {isOnboarding
                  ? "Finish setting up your PrideServe profile"
                  : "Service hours & campus opportunities"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSignedIn ? (
              <>
                <NotificationBell />
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-plp-navy text-xs font-semibold text-white"
                  aria-label="Signed-in user avatar"
                  title={profile?.full_name || profile?.email || "Account"}
                >
                  {initials}
                </div>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="rounded-md p-2 text-slate-500 hover:bg-plp-slate-surface hover:text-plp-navy"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-plp-navy hover:bg-plp-slate-surface"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal("signup")}
                  className="rounded-lg bg-plp-navy px-3 py-1.5 text-sm font-semibold text-white hover:bg-plp-navy-dark"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <AccessNotice />
          {children}
        </main>
      </div>
    </div>
  );
}
