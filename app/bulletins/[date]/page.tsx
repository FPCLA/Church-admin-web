import { BulletinDatePage } from "@/lib/phase3/pages";

export default async function BulletinDateRoute({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams?: Promise<{ auto?: string; status?: string }>;
}) {
  const { date } = await params;
  const query = (await searchParams) || {};
  return <BulletinDatePage auto={query.auto} date={date} status={query.status} />;
}
