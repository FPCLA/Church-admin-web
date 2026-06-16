import { ServiceRolesPage } from "@/lib/phase3/pages";

export default async function ServiceRolesRoute({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const params = (await searchParams) || {};
  return <ServiceRolesPage status={params.status} />;
}
