import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import AuthProvider from "@/components/AuthProvider";
import DevRoleSwitcher from "@/components/DevRoleSwitcher";
import { isDevToolbarEnabled, readDevPersonaId } from "@/lib/dev-roles.server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PrideServe | Pine Lake Prep",
  description:
    "Public service-hour opportunities and campus task feed for Pine Lake Preparatory.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const devToolbar = isDevToolbarEnabled();
  const devPersonaId = await readDevPersonaId();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${
        devToolbar ? "has-dev-toolbar" : ""
      }`}
    >
      <body className="min-h-full">
        {devToolbar ? (
          <DevRoleSwitcher initialPersonaId={devPersonaId} />
        ) : null}
        <Suspense fallback={null}>
          <AuthProvider devPersonaId={devPersonaId}>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
