import { ModuleDetailPage } from "@/lib/phase3/pages";

export default async function CalendarEventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const query = (await searchParams) || {};
  return <ModuleDetailPage id={id} moduleName="calendar_events" status={query.status} />;
}
