import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SignOutButton } from "@/components/SignOutButton";
import { requireAdminPagePermission } from "@/lib/admin/access";
import { getProfiles } from "@/lib/admin/queries";
import { translate } from "@/lib/i18n/dictionaries";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type PageProps = { searchParams?: Promise<{ from?: string; to?: string; changed_by?: string; table_name?: string; action?: string }> };

type ChangeLogRow = {
  id: string;
  table_name: string;
  record_id: string | null;
  action: string;
  old_data: unknown;
  new_data: unknown;
  changed_by: string | null;
  changed_at: string;
};

export default async function AdminChangeLogsPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const { user, profile } = await requireAdminPagePermission("change_logs", "preview");
  const t = translate(profile.language_preference);
  const admin = getSupabaseAdminClient();
  const { data: adminRole } = await admin
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", user.id)
    .eq("active", true)
    .returns<Array<{ roles: { name: string } | null }>>();
  const isAdmin = (adminRole || []).some((row) => row.roles?.name === "admin");
  const [logs, profiles] = await Promise.all([getChangeLogs(params, isAdmin ? null : user.id), getProfiles()]);
  const profileById = Object.fromEntries(profiles.map((person) => [person.id, person]));

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4"><div><p className="text-sm font-medium text-sky-700">{t("app.name")}</p><h1 className="text-2xl font-semibold">{t("admin.logs.title")}</h1></div><div className="flex items-center gap-3"><LanguageSwitcher initialLocale={profile.language_preference} /><SignOutButton label={t("common.signOut")} /></div></div></header>
      <section className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <nav className="flex flex-wrap gap-2 text-sm"><a className="rounded border bg-white px-3 py-2" href="/dashboard">{t("dashboard.title")}</a><a className="rounded border bg-white px-3 py-2" href="/admin/users">{t("admin.users.title")}</a><a className="rounded border bg-white px-3 py-2" href="/admin/permissions">{t("admin.permissions.title")}</a></nav>
        <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-5">
          <label className="grid gap-1 text-sm">{t("admin.logs.from")}<input className="rounded border px-3 py-2" name="from" type="date" defaultValue={params.from || ""} /></label>
          <label className="grid gap-1 text-sm">{t("admin.logs.to")}<input className="rounded border px-3 py-2" name="to" type="date" defaultValue={params.to || ""} /></label>
          <label className="grid gap-1 text-sm">{t("admin.logs.changedBy")}<select className="rounded border px-3 py-2" name="changed_by" defaultValue={params.changed_by || ""}><option value="">{t("common.all")}</option>{profiles.map((person) => <option key={person.id} value={person.id}>{person.full_name || person.email}</option>)}</select></label>
          <label className="grid gap-1 text-sm">{t("admin.logs.tableName")}<input className="rounded border px-3 py-2" name="table_name" defaultValue={params.table_name || ""} /></label>
          <label className="grid gap-1 text-sm">{t("admin.logs.action")}<input className="rounded border px-3 py-2" name="action" defaultValue={params.action || ""} /></label>
          <button className="rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white md:col-span-5">{t("common.filter")}</button>
        </form>
        <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white"><table className="min-w-[1000px] w-full text-sm"><thead className="bg-slate-100 text-left"><tr><th className="p-3">{t("admin.logs.changedAt")}</th><th className="p-3">{t("admin.logs.changedBy")}</th><th className="p-3">{t("admin.logs.tableName")}</th><th className="p-3">{t("admin.logs.action")}</th><th className="p-3">record_id</th><th className="p-3">{t("admin.logs.details")}</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id} className="border-t align-top"><td className="p-3">{new Date(log.changed_at).toLocaleString()}</td><td className="p-3">{log.changed_by ? profileById[log.changed_by]?.full_name || log.changed_by : "-"}</td><td className="p-3">{log.table_name}</td><td className="p-3">{log.action}</td><td className="p-3">{log.record_id || "-"}</td><td className="p-3"><details><summary className="cursor-pointer text-sky-700">{t("admin.logs.details")}</summary><div className="mt-2 grid gap-2 md:grid-cols-2"><pre className="max-h-80 overflow-auto rounded bg-slate-100 p-2 text-xs">{JSON.stringify(log.old_data, null, 2)}</pre><pre className="max-h-80 overflow-auto rounded bg-slate-100 p-2 text-xs">{JSON.stringify(log.new_data, null, 2)}</pre></div></details></td></tr>)}</tbody></table></section>
      </section>
    </main>
  );
}

async function getChangeLogs(params: Awaited<PageProps["searchParams"]>, restrictToUserId: string | null) {
  const admin = getSupabaseAdminClient();
  let query = admin.from("change_logs").select("id, table_name, record_id, action, old_data, new_data, changed_by, changed_at").order("changed_at", { ascending: false }).limit(200);
  if (params?.from) query = query.gte("changed_at", params.from);
  if (params?.to) query = query.lte("changed_at", `${params.to}T23:59:59`);
  if (params?.changed_by) query = query.eq("changed_by", params.changed_by);
  if (restrictToUserId) query = query.eq("changed_by", restrictToUserId);
  if (params?.table_name) query = query.eq("table_name", params.table_name);
  if (params?.action) query = query.eq("action", params.action);
  const { data } = await query.returns<ChangeLogRow[]>();
  return data || [];
}
