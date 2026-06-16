import { ModuleListPage } from "@/lib/phase3/pages";

export default async function ServiceAssignmentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const params = (await searchParams) || {};
  return <ModuleListPage moduleName="service_assignments" status={params.status} />;
}
