import {
  approveUser,
  assignRole,
  createCoworker,
  deleteCoworker,
  disableUser,
  enableUser,
  removeRole,
  sendPasswordSetupEmail,
  updateUserProfile,
} from "@/app/actions/admin";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SignOutButton } from "@/components/SignOutButton";
import { SyncedHorizontalScroll } from "@/components/SyncedHorizontalScroll";
import { requireAdminPagePermission } from "@/lib/admin/access";
import { getProfiles, getRoles, getUserRoles } from "@/lib/admin/queries";
import { translate } from "@/lib/i18n/dictionaries";
import { resolveEffectivePermissions } from "@/lib/permissions";

type PageProps = {
  searchParams?: Promise<{ status?: string }>;
};

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
      <AdminHeader title={t("admin.users.title")} locale={profile.language_preference} />
      <section className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <nav className="flex flex-wrap gap-2 text-sm">
          <a className="rounded border border-slate-200 bg-white px-3 py-2" href="/dashboard">
            {t("dashboard.title")}
          </a>
          <a className="rounded border border-slate-200 bg-white px-3 py-2" href="/admin/permissions">
            {t("admin.permissions.title")}
          </a>
          <a className="rounded border border-slate-200 bg-white px-3 py-2" href="/admin/change-logs">
            {t("admin.logs.title")}
          </a>
        </nav>

        <StatusMessage status={params.status} t={t} />

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">{t("admin.users.inviteCoworker")}</h2>
          <form action={createCoworker} className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-sm">
              {t("admin.users.fullName")}
              <input className="rounded border border-slate-300 px-3 py-2" name="full_name" />
            </label>
            <label className="grid gap-1 text-sm">
              {t("common.email")}
              <input className="rounded border border-slate-300 px-3 py-2" name="email" type="email" required />
            </label>
            <label className="grid gap-1 text-sm">
              {t("admin.users.initialRole")}
              <select className="rounded border border-slate-300 px-3 py-2" name="role_id">
                <option value="">{t("common.none")}</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.display_name_zh} / {role.display_name_en}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm md:col-span-3">
              {t("admin.users.notes")}
              <textarea className="rounded border border-slate-300 px-3 py-2" name="notes" rows={2} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input name="approved" type="checkbox" /> {t("admin.users.approved")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input name="active" type="checkbox" defaultChecked /> {t("admin.users.active")}
            </label>
            <div className="md:col-span-3">
              <button className="rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white">
                {t("admin.users.inviteCoworker")}
              </button>
            </div>
          </form>
        </section>

        <SyncedHorizontalScroll contentWidthClassName="min-w-[1100px]">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead className="bg-slate-100 text-left text-slate-700">
              <tr>
                <th className="p-3">{t("admin.users.fullName")}</th>
                <th className="p-3">{t("common.email")}</th>
                <th className="p-3">{t("admin.users.roles")}</th>
                <th className="p-3">{t("admin.users.status")}</th>
                <th className="p-3">{t("admin.users.language")}</th>
                <th className="p-3">{t("admin.users.lastLogin")}</th>
                <th className="p-3">{t("admin.users.createdAt")}</th>
                <th className="p-3">{t("admin.users.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((person) => {
                const activeRoles = (rolesByUser[person.id] || []).filter((row) => row.active);
                return (
                  <tr key={person.id} className="border-t border-slate-200 align-top">
                    <td className="p-3">
                      <form action={updateUserProfile} className="grid gap-2">
                        <input name="profile_id" type="hidden" value={person.id} />
                        <input
                          className="rounded border border-slate-300 px-2 py-1"
                          name="full_name"
                          defaultValue={person.full_name || ""}
                        />
                        <textarea
                          className="rounded border border-slate-300 px-2 py-1"
                          name="notes"
                          defaultValue={person.notes || ""}
                          placeholder={t("admin.users.notes")}
                        />
                        <button className="rounded border border-slate-300 px-2 py-1">
                          {t("common.save")}
                        </button>
                      </form>
                    </td>
                    <td className="p-3">{person.email}</td>
                    <td className="space-y-2 p-3">
                      {activeRoles.length === 0 && <p className="text-slate-500">{t("common.none")}</p>}
                      {activeRoles.map((row) => {
                        const role = roleById[row.role_id];
                        return (
                          <form key={row.id} action={removeRole} className="flex items-center gap-2">
                            <input name="user_role_id" type="hidden" value={row.id} />
                            <span>
                              {role ? `${role.display_name_zh} / ${role.display_name_en}` : row.role_id}
                              {row.end_date ? ` (${row.end_date})` : ""}
                            </span>
                            <button className="rounded border border-rose-200 px-2 py-1 text-rose-700">
                              {t("admin.users.removeRole")}
                            </button>
                          </form>
                        );
                      })}
                      <form action={assignRole} className="grid gap-2">
                        <input name="user_id" type="hidden" value={person.id} />
                        <select className="rounded border border-slate-300 px-2 py-1" name="role_id" required>
                          <option value="">{t("admin.users.assignRole")}</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.display_name_zh} / {role.display_name_en}
                            </option>
                          ))}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                          <input className="rounded border border-slate-300 px-2 py-1" name="start_date" type="date" />
                          <input className="rounded border border-slate-300 px-2 py-1" name="end_date" type="date" />
                        </div>
                        <button className="rounded border border-slate-300 px-2 py-1">
                          {t("admin.users.assignRole")}
                        </button>
                      </form>
                    </td>
                    <td className="space-y-2 p-3">
                      <StatusBadge ok={person.approved} label={t("admin.users.approved")} />
                      <StatusBadge ok={person.active} label={t("admin.users.active")} />
                    </td>
                    <td className="p-3">{person.language_preference || "zh-TW"}</td>
                    <td className="p-3">{formatDate(person.last_login_at)}</td>
                    <td className="p-3">{formatDate(person.created_at)}</td>
                    <td className="space-y-2 p-3">
                      <form action={sendPasswordSetupEmail}>
                        <input name="profile_id" type="hidden" value={person.id} />
                        <button className="rounded border border-sky-200 px-3 py-1 text-sky-700">
                          {t("admin.users.resendInvitation")}
                        </button>
                      </form>
                      {!person.approved && (
                        <form action={approveUser}>
                          <input name="profile_id" type="hidden" value={person.id} />
                          <button className="rounded bg-emerald-700 px-3 py-1 text-white">
                            {t("admin.users.approve")}
                          </button>
                        </form>
                      )}
                      {person.active ? (
                        <form action={disableUser}>
                          <input name="profile_id" type="hidden" value={person.id} />
                          <button className="rounded bg-rose-700 px-3 py-1 text-white">
                            {t("admin.users.disable")}
                          </button>
                        </form>
                      ) : (
                        <form action={enableUser}>
                          <input name="profile_id" type="hidden" value={person.id} />
                          <button className="rounded bg-sky-700 px-3 py-1 text-white">
                            {t("admin.users.enable")}
                          </button>
                        </form>
                      )}
                      <details>
                        <summary className="cursor-pointer text-sky-700">
                          {t("admin.users.effectivePermissions")}
                        </summary>
                        <EffectivePermissions userId={person.id} />
                      </details>
                      <a className="block text-sky-700" href={`/admin/change-logs?changed_by=${person.id}`}>
                        {t("admin.users.relatedLogs")}
                      </a>
                      {person.id !== profile.id ? (
                        <details className="rounded border border-rose-200 p-2">
                          <summary className="cursor-pointer text-rose-700">
                            {"\u522a\u9664\u540c\u5de5"}
                          </summary>
                          <form action={deleteCoworker} className="mt-2 space-y-2">
                            <input name="profile_id" type="hidden" value={person.id} />
                            <p className="text-xs leading-5 text-slate-600">
                              {"\u522a\u9664\u5f8c\u5c07\u505c\u7528\u5e33\u865f\u4e26\u5f9e\u540c\u5de5\u5217\u8868\u96b1\u85cf\uff0c\u6b77\u53f2\u7d00\u9304\u4fdd\u7559\u3002"}
                            </p>
                            <label className="flex items-center gap-2 text-xs text-slate-700">
                              <input name="confirm_delete" type="checkbox" required />
                              {"\u6211\u78ba\u8a8d\u8981\u522a\u9664\u9019\u4f4d\u540c\u5de5"}
                            </label>
                            <button className="rounded bg-rose-700 px-3 py-1 text-white">
                              {"\u522a\u9664\u540c\u5de5"}
                            </button>
                          </form>
                        </details>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </SyncedHorizontalScroll>
      </section>
    </main>
  );
}

async function EffectivePermissions({ userId }: { userId: string }) {
  const permissions = await resolveEffectivePermissions(userId);
  return (
    <pre className="mt-2 max-w-xs overflow-auto rounded bg-slate-100 p-2 text-xs">
      {JSON.stringify(permissions, null, 2)}
    </pre>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`block rounded px-2 py-1 text-xs ${ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
      {label}: {ok ? "Yes" : "No"}
    </span>
  );
}

function StatusMessage({
  status,
  t,
}: {
  status?: string;
  t: (key: string) => string;
}) {
  if (!status) {
    return null;
  }

  const okStatuses = ["saved", "invited", "email_failed", "deleted"];
  const ok = okStatuses.includes(status);
  const messages: Record<string, string> = {
    deleted:
      "\u540c\u5de5\u5df2\u522a\u9664\uff0c\u4e26\u5df2\u5f9e\u5217\u8868\u96b1\u85cf\u3002 / Coworker deleted and hidden from the list.",
    delete_not_confirmed:
      "\u8acb\u5148\u52fe\u9078\u78ba\u8a8d\u522a\u9664\u3002 / Confirm deletion first.",
    delete_self_blocked:
      "\u4e0d\u80fd\u522a\u9664\u76ee\u524d\u767b\u5165\u7684\u81ea\u5df1\u5e33\u865f\u3002 / You cannot delete your own signed-in account.",
    user_not_found:
      "\u627e\u4e0d\u5230\u9019\u4f4d\u540c\u5de5\u3002 / Coworker was not found.",
    delete_failed:
      "\u522a\u9664\u540c\u5de5\u5931\u6557\uff0c\u8acb\u7a0d\u5f8c\u518d\u8a66\u3002 / Coworker deletion failed. Try again later.",
    missing_email: "Please enter an email.",
    user_create_failed:
      "Login account creation failed. Check the email or try again later.",
    profile_failed: "Coworker profile creation failed. Try again later.",
    role_failed:
      "Role assignment failed. Check that the coworker and role exist, or try again later.",
    role_missing: "Please select both a coworker and a role.",
    email_failed:
      "Coworker was saved, but the password setup email failed. Please resend it later from the user list.",
  };
  const message =
    status === "invited"
      ? t("admin.users.inviteSent")
      : messages[status] || (ok ? t("common.updateSucceeded") : t("common.updateFailed"));

  return (
    <div className={`rounded-lg border p-4 ${ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
      {message}
    </div>
  );
}

function AdminHeader({ title, locale }: { title: string; locale?: string | null }) {
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

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}
