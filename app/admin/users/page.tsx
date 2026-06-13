import {
  approveUser,
  assignRole,
  createCoworker,
  disableUser,
  enableUser,
  removeRole,
  updateUserProfile,
} from "@/app/actions/admin";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SignOutButton } from "@/components/SignOutButton";
import { requireAdminPagePermission } from "@/lib/admin/access";
import { getProfiles, getRoles, getUserRoles } from "@/lib/admin/queries";
import { translate } from "@/lib/i18n/dictionaries";

type PageProps = { searchParams?: Promise<{ status?: string }> };

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const { profile } = await requireAdminPagePermission("user_management", "manage");
  const t = translate(profile.language_preference);
  const [profiles, roles, userRoles] = await Promise.all([
    getProfiles(),
    getRoles(),
    getUserRoles(),
  ]);
  const roleById = Object.fromEntries(roles.map((role) => [role.id, role]));
  const rolesByUser = userRoles.reduce<Record<string, typeof userRoles>>((acc, row) => {
    acc[row.user_id] = acc[row.user_id] || [];
    acc[row.user_id].push(row);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm font-medium text-sky-700">{t("app.name")}</p>
            <h1 className="text-2xl font-semibold">{t("admin.users.title")}</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher initialLocale={profile.language_preference} />
            <SignOutButton label={t("common.signOut")} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <nav className="flex flex-wrap gap-2 text-sm">
          <a className="rounded border bg-white px-3 py-2" href="/dashboard">{t("dashboard.title")}</a>
          <a className="rounded border bg-white px-3 py-2" href="/admin/permissions">{t("admin.permissions.title")}</a>
          <a className="rounded border bg-white px-3 py-2" href="/admin/change-logs">{t("admin.logs.title")}</a>
        </nav>

        {params.status && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            {params.status === "saved" ? t("common.updateSucceeded") : t("common.updateFailed")}
          </div>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">{t("admin.users.addCoworker")}</h2>
          <form action={createCoworker} className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-sm">{t("admin.users.fullName")}<input className="rounded border px-3 py-2" name="full_name" /></label>
            <label className="grid gap-1 text-sm">{t("common.email")}<input className="rounded border px-3 py-2" name="email" type="email" required /></label>
            <label className="grid gap-1 text-sm">{t("admin.users.initialRole")}<select className="rounded border px-3 py-2" name="role_id"><option value="">{t("common.none")}</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.display_name_zh} / {role.display_name_en}</option>)}</select></label>
            <label className="grid gap-1 text-sm md:col-span-3">{t("admin.users.notes")}<textarea className="rounded border px-3 py-2" name="notes" rows={2} /></label>
            <label className="flex items-center gap-2 text-sm"><input name="approved" type="checkbox" /> {t("admin.users.approved")}</label>
            <label className="flex items-center gap-2 text-sm"><input name="active" type="checkbox" defaultChecked /> {t("admin.users.active")}</label>
            <button className="rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white md:col-span-3">{t("admin.users.addCoworker")}</button>
          </form>
        </section>

        <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-slate-100 text-left"><tr><th className="p-3">{t("admin.users.fullName")}</th><th className="p-3">{t("common.email")}</th><th className="p-3">{t("admin.users.roles")}</th><th className="p-3">{t("admin.users.status")}</th><th className="p-3">{t("admin.users.language")}</th><th className="p-3">{t("admin.users.lastLogin")}</th><th className="p-3">{t("admin.users.createdAt")}</th><th className="p-3">{t("admin.users.actions")}</th></tr></thead>
            <tbody>
              {profiles.map((person) => {
                const activeRoles = (rolesByUser[person.id] || []).filter((row) => row.active);
                return (
                  <tr key={person.id} className="border-t align-top">
                    <td className="p-3"><form action={updateUserProfile} className="grid gap-2"><input name="profile_id" type="hidden" value={person.id} /><input className="rounded border px-2 py-1" name="full_name" defaultValue={person.full_name || ""} /><textarea className="rounded border px-2 py-1" name="notes" defaultValue={person.notes || ""} placeholder={t("admin.users.notes")} /><button className="rounded border px-2 py-1">{t("common.save")}</button></form></td>
                    <td className="p-3">{person.email}</td>
                    <td className="space-y-2 p-3">
                      {activeRoles.length === 0 && <p className="text-slate-500">{t("common.none")}</p>}
                      {activeRoles.map((row) => <form key={row.id} action={removeRole} className="flex items-center gap-2"><input name="user_role_id" type="hidden" value={row.id} /><span>{roleById[row.role_id]?.display_name_zh || row.role_id}</span><button className="rounded border border-rose-200 px-2 py-1 text-rose-700">{t("admin.users.removeRole")}</button></form>)}
                      <form action={assignRole} className="grid gap-2"><input name="user_id" type="hidden" value={person.id} /><select className="rounded border px-2 py-1" name="role_id" required>{roles.map((role) => <option key={role.id} value={role.id}>{role.display_name_zh}</option>)}</select><div className="grid grid-cols-2 gap-2"><input className="rounded border px-2 py-1" name="start_date" type="date" /><input className="rounded border px-2 py-1" name="end_date" type="date" /></div><button className="rounded border px-2 py-1">{t("admin.users.assignRole")}</button></form>
                    </td>
                    <td className="space-y-2 p-3"><span className="block rounded bg-slate-100 px-2 py-1">{t("admin.users.approved")}: {person.approved ? "Yes" : "No"}</span><span className="block rounded bg-slate-100 px-2 py-1">{t("admin.users.active")}: {person.active ? "Yes" : "No"}</span></td>
                    <td className="p-3">{person.language_preference || "zh-TW"}</td>
                    <td className="p-3">{formatDate(person.last_login_at)}</td>
                    <td className="p-3">{formatDate(person.created_at)}</td>
                    <td className="space-y-2 p-3">{!person.approved && <form action={approveUser}><input name="profile_id" type="hidden" value={person.id} /><button className="rounded bg-emerald-700 px-3 py-1 text-white">{t("admin.users.approve")}</button></form>}{person.active ? <form action={disableUser}><input name="profile_id" type="hidden" value={person.id} /><button className="rounded bg-rose-700 px-3 py-1 text-white">{t("admin.users.disable")}</button></form> : <form action={enableUser}><input name="profile_id" type="hidden" value={person.id} /><button className="rounded bg-sky-700 px-3 py-1 text-white">{t("admin.users.enable")}</button></form>}<a className="block text-sky-700" href={`/admin/change-logs?changed_by=${person.id}`}>{t("admin.users.relatedLogs")}</a></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </section>
    </main>
  );
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}
