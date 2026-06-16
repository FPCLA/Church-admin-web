import { ModuleListPage } from "@/lib/phase3/pages";

export default async function SpeakerAssignmentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const params = (await searchParams) || {};
  return <ModuleListPage moduleName="speaker_assignments" status={params.status} />;
}
