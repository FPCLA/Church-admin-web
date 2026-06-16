import { ModuleListPage } from "@/lib/phase3/pages";

export default async function BulletinsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const params = (await searchParams) || {};
  return <ModuleListPage moduleName="bulletins" status={params.status} />;
}
