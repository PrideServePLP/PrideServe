import { navItems } from "@/lib/nav";

export default function PlaceholderPage({ href }: { href: string }) {
  const item = navItems.find((entry) => entry.href === href);
  const Icon = item?.icon;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-xl border border-plp-slate-border bg-white p-8 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-plp-navy text-white">
          {Icon ? <Icon className="h-6 w-6" /> : null}
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-plp-navy">
          {item?.label}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{item?.description}</p>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          This workspace is reserved for authenticated users. The public General
          Task Feed stays open so students can browse and sign up without
          logging in first.
        </p>
      </div>
    </div>
  );
}
