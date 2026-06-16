import { ModuleListPage } from "@/lib/phase3/pages";

export default async function SpeakersPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const params = (await searchParams) || {};
  return <ModuleListPage moduleName="speakers" status={params.status} />;
}
