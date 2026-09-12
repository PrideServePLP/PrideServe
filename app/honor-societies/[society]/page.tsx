import { notFound } from "next/navigation";
import SocietyTaskPanel from "@/components/SocietyTaskPanel";
import { HONOR_SOCIETY_SLUGS } from "@/lib/route-access";

export default async function HonorSocietyPage({
  params,
}: PageProps<"/honor-societies/[society]">) {
  const { society: slug } = await params;
  const society = HONOR_SOCIETY_SLUGS[slug.toLowerCase()];

  if (!society) {
    notFound();
  }

  return <SocietyTaskPanel society={society} />;
}
