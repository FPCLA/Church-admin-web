import { ModuleListPage } from "@/lib/phase3/pages";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const params = (await searchParams) || {};
  return <ModuleListPage moduleName="calendar_events" status={params.status} />;
}
