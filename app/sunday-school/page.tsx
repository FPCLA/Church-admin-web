import { ModuleListPage } from "@/lib/phase3/pages";

export default async function SundaySchoolPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const params = (await searchParams) || {};
  return <ModuleListPage moduleName="sunday_school_classes" status={params.status} />;
}
