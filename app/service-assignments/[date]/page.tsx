import { ServiceAssignmentsDatePage } from "@/lib/phase3/pages";

export default async function ServiceAssignmentsDateRoute({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams?: Promise<{ status?: string }>;
}) {
  const { date } = await params;
  const query = (await searchParams) || {};
  return <ServiceAssignmentsDatePage date={date} status={query.status} />;
}
