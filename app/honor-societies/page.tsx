import { Award } from "lucide-react";

export default function HonorSocietiesPage() {
  return (
    <div className="rounded-xl border border-dashed border-plp-slate-border bg-white px-6 py-16 text-center">
      <Award className="mx-auto h-6 w-6 text-plp-navy" />
      <p className="mt-3 text-sm font-semibold text-plp-navy">
        Choose a chapter
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Pick one of your societies above to see its internal club service and
        external community tasks.
      </p>
    </div>
  );
}
