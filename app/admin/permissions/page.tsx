import {
  saveRecordAssignment,
  saveRolePermissions,
  saveUserOverrides,
} from "@/app/actions/admin";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PermissionRowBulkActions } from "@/components/PermissionRowBulkActions";
import { SignOutButton } from "@/components/SignOutButton";
import { adminModules, permissionActions, permissionColumnByAction } from "@/lib/admin/constants";
import { requireAdminPagePermission } from "@/lib/admin/access";
import {
  getPermissionValue,
  getProfiles,
  getRecordAssignments,
  getRolePermissions,
  getRoles,
  getUserOverrides,
  type PermissionRow,
} from "@/lib/admin/queries";
import { translate } from "@/lib/i18n/dictionaries";
import type { PermissionAction } from "@/lib/permissions";

type PageProps = {
  searchParams?: Promise<{ role?: string; user?: string; status?: string }>;
};

export default async function AdminPermissionsPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const { profile } = await requireAdminPagePermission("permission_management", "manage");
  const t = translate(profile.language_preference);
  const [roles, profiles, assignments] = await Promise.all([
    getRoles(),
    getProfiles(),
    getRecordAssignments(),
  ]);
  const selectedRoleId = params.role || roles[0]?.id || "";
  const selectedUserId = params.user || profiles[0]?.id || "";
  const [rolePermissions, userOverrides] = await Promise.all([
    selectedRoleId ? getRolePermissions(selectedRoleId) : Promise.resolve({}),
    selectedUserId ? getUserOverrides(selectedUserId) : Promise.resolve({}),
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      <Header title={t("admin.permissions.title")} locale={profile.language_preference} />
      <section className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <nav className="flex flex-wrap gap-2 text-sm">
          <a className="rounded border border-slate-200 bg-white px-3 py-2" href="/dashboard">
            {t("dashboard.title")}
          </a>
          <a className="rounded border border-slate-200 bg-white px-3 py-2" href="/admin/users">
            {t("admin.users.title")}
          </a>
          <a className="rounded border border-slate-200 bg-white px-3 py-2" href="/admin/change-logs">
            {t("admin.logs.title")}
          </a>
        </nav>

        {params.status && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            {t("common.updateSucceeded")}
          </div>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">{t("admin.permissions.roleDefaults")}</h2>
          <form className="mt-3">
            <label className="grid max-w-sm gap-1 text-sm">
              {t("admin.users.roles")}
              <select
                className="rounded border border-slate-300 px-3 py-2"
                name="role"
                defaultValue={selectedRoleId}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.display_name_zh} / {role.display_name_en}
                  </option>
                ))}
              </select>
            </label>
            <button className="mt-2 rounded border border-slate-300 px-3 py-2" formMethod="get">
              {t("common.load")}
            </button>
          </form>
          <form action={saveRolePermissions} className="mt-4">
            <input name="role_id" type="hidden" value={selectedRoleId} />
            <PermissionMatrix
              t={t}
              mode="checkbox"
              values={rolePermissions}
            />
            <button className="mt-4 rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white">
              {t("common.save")}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">{t("admin.permissions.userOverrides")}</h2>
          <form className="mt-3">
            <label className="grid max-w-sm gap-1 text-sm">
              {t("admin.users.title")}
              <select className="rounded border border-slate-300 px-3 py-2" name="user" defaultValue={selectedUserId}>
                {profiles.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.full_name || person.email}
                  </option>
                ))}
              </select>
            </label>
            <button className="mt-2 rounded border border-slate-300 px-3 py-2" formMethod="get">
              {t("common.load")}
            </button>
          </form>
          <form action={saveUserOverrides} className="mt-4">
            <input name="user_id" type="hidden" value={selectedUserId} />
            <PermissionMatrix t={t} mode="triState" values={userOverrides} />
            <button className="mt-4 rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white">
              {t("common.save")}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">{t("admin.permissions.recordAssignments")}</h2>
          <form action={saveRecordAssignment} className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-sm">
              {t("admin.users.title")}
              <select className="rounded border border-slate-300 px-3 py-2" name="user_id" required>
                {profiles.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.full_name || person.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              {t("admin.permissions.module")}
              <select className="rounded border border-slate-300 px-3 py-2" name="module_name" required>
                {adminModules.map((moduleName) => (
                  <option key={moduleName} value={moduleName}>
                    {moduleName}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              record_id
              <input className="rounded border border-slate-300 px-3 py-2" name="record_id" required />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input name="can_preview" type="checkbox" /> {t("admin.permissions.preview")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input name="can_edit" type="checkbox" /> {t("admin.permissions.edit")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input name="can_manage" type="checkbox" /> {t("admin.permissions.manage")}
            </label>
            <label className="grid gap-1 text-sm">
              start_date
              <input className="rounded border border-slate-300 px-3 py-2" name="start_date" type="date" />
            </label>
            <label className="grid gap-1 text-sm">
              end_date
              <input className="rounded border border-slate-300 px-3 py-2" name="end_date" type="date" />
            </label>
            <div className="md:col-span-3">
              <button className="rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white">
                {t("common.save")}
              </button>
            </div>
          </form>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[800px] w-full text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="p-2">user_id</th>
                  <th className="p-2">{t("admin.permissions.module")}</th>
                  <th className="p-2">record_id</th>
                  <th className="p-2">{t("admin.permissions.permissions")}</th>
                  <th className="p-2">dates</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="border-t border-slate-200">
                    <td className="p-2">{assignment.user_id}</td>
                    <td className="p-2">{assignment.module_name}</td>
                    <td className="p-2">{assignment.record_id}</td>
                    <td className="p-2">
                      {["can_preview", "can_edit", "can_manage"]
                        .filter((key) => Boolean(assignment[key as keyof typeof assignment]))
                        .join(", ")}
                    </td>
                    <td className="p-2">
                      {assignment.start_date || "-"} / {assignment.end_date || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

function PermissionMatrix({
  t,
  mode,
  values,
}: {
  t: (key: string) => string;
  mode: "checkbox" | "triState";
  values: Record<string, PermissionRow | undefined>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[980px] w-full border-collapse text-sm">
        <thead className="bg-slate-100 text-left">
          <tr>
            <th className="p-2">{t("admin.permissions.module")}</th>
            {permissionActions.map((action) => (
              <th key={action} className="p-2">
                {t(`admin.permissions.${action}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {adminModules.map((moduleName) => (
            <tr key={moduleName} className="border-t border-slate-200">
              <td className="p-2">
                <div className="flex min-w-52 flex-wrap items-center gap-3">
                  <span className="font-medium">{moduleName}</span>
                  <PermissionRowBulkActions
                    clearLabel={t("admin.permissions.clearAll")}
                    mode={mode}
                    selectLabel={t("admin.permissions.selectAll")}
                  />
                </div>
              </td>
              {permissionActions.map((action) => (
                <td key={action} className="p-2">
                  {mode === "checkbox" ? (
                    <input
                      data-permission-control
                      name={`${moduleName}:${action}`}
                      type="checkbox"
                      defaultChecked={Boolean(getPermissionValue(values[moduleName], action))}
                    />
                  ) : (
                    <TriStateSelect
                      action={action}
                      moduleName={moduleName}
                      value={getRawPermissionValue(values[moduleName], action)}
                      t={t}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getRawPermissionValue(
  row: PermissionRow | undefined,
  action: PermissionAction,
) {
  const column = permissionColumnByAction[action] as keyof PermissionRow;
  return row?.[column];
}

function TriStateSelect({
  moduleName,
  action,
  value,
  t,
}: {
  moduleName: string;
  action: PermissionAction;
  value: unknown;
  t: (key: string) => string;
}) {
  const selected = value === true ? "allow" : value === false ? "deny" : "inherit";
  return (
    <select
      data-permission-control
      className="rounded border border-slate-300 px-2 py-1"
      name={`${moduleName}:${action}`}
      defaultValue={selected}
    >
      <option value="inherit">{t("admin.permissions.inherit")}</option>
      <option value="allow">{t("admin.permissions.allow")}</option>
      <option value="deny">{t("admin.permissions.deny")}</option>
    </select>
  );
}

function Header({ title, locale }: { title: string; locale?: string | null }) {
  const t = translate(locale);
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div>
          <p className="text-sm font-medium text-sky-700">{t("app.name")}</p>
          <h1 className="text-2xl font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher initialLocale={locale || "zh-TW"} />
          <SignOutButton label={t("common.signOut")} />
        </div>
      </div>
    </header>
  );
}
