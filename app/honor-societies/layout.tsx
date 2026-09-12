import SocietyTabs from "@/components/SocietyTabs";

export default function HonorSocietiesLayout({
  children,
}: LayoutProps<"/honor-societies">) {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-plp-navy">
          Members only
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-plp-navy">
          Honor Societies Hub
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Each chapter keeps its own task list. Tabs for societies you are not
          enrolled in stay locked.
        </p>
      </div>

      <SocietyTabs />

      {children}
    </div>
  );
}
