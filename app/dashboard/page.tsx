import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SignOutButton } from "@/components/SignOutButton";
import { adminModules } from "@/lib/admin/constants";
import { requireApprovedProfile } from "@/lib/auth";
import { translate } from "@/lib/i18n/dictionaries";
import { hasPermission } from "@/lib/permissions";

type PageProps = { searchParams?: Promise<{ error?: string }> };

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const { user, profile } = await requireApprovedProfile();
  const t = translate(profile.language_preference);
  const modulePermissions = await Promise.all(
    adminModules.map(async (moduleName) => ({ moduleName, canPreview: await hasPermission(user.id, moduleName, "preview") })),
  );
  const visibleModules = modulePermissions.filter((item) => item.canPreview);
  const adminLinks = [
    { href: "/admin/users", label: t("admin.users.title"), visible: await hasPermission(user.id, "user_management", "manage") },
    { href: "/admin/permissions", label: t("admin.permissions.title"), visible: await hasPermission(user.id, "permission_management", "manage") },
    { href: "/admin/change-logs", label: t("admin.logs.title"), visible: await hasPermission(user.id, "change_logs", "preview") },
  ].filter((link) => link.visible);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4"><div><p className="text-sm font-medium text-sky-700">{t("app.name")}</p><h1 className="text-2xl font-semibold text-slate-950">{t("dashboard.title")}</h1></div><div className="flex items-center gap-3"><LanguageSwitcher initialLocale={profile.language_preference} /><SignOutButton label={t("common.signOut")} /></div></div></header>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-8 md:grid-cols-3">
        {params.error === "unauthorized" && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 md:col-span-3">{t("common.unauthorizedMessage")}</div>}
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:col-span-2"><p className="text-sm font-medium text-slate-500">{t("dashboard.welcome")}</p><h2 className="mt-2 text-xl font-semibold text-slate-950">{profile.full_name || profile.email}</h2><p className="mt-4 leading-7 text-slate-700">{t("dashboard.phase")}</p><p className="mt-3 leading-7 text-slate-700">{t("dashboard.security")}</p></article>
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="space-y-3"><div className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{t("dashboard.statusApproved")}</div><div className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{t("dashboard.statusActive")}</div></div></aside>
        {adminLinks.length > 0 && <article className="rounded-lg border border-slate-200 bg-white p-5 md:col-span-3"><h2 className="text-lg font-semibold">{t("admin.title")}</h2><div className="mt-4 flex flex-wrap gap-3">{adminLinks.map((link) => <a className="rounded border border-slate-200 px-3 py-2 text-sm text-sky-700" href={link.href} key={link.href}>{link.label}</a>)}</div></article>}
        <article className="rounded-lg border border-slate-200 bg-white p-5 md:col-span-3"><h2 className="text-lg font-semibold">{t("dashboard.modules")}</h2>{visibleModules.length === 0 ? <p className="mt-3 text-slate-600">{t("dashboard.noModules")}</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{visibleModules.map((item) => <a className="rounded border border-slate-200 p-4 hover:border-sky-300" href={`/modules/${item.moduleName}`} key={item.moduleName}><span className="font-medium">{t(`modules.${item.moduleName}`)}</span><span className="mt-2 block text-sm text-slate-500">{t("common.comingSoon")}</span></a>)}</div>}</article>
      </section>
    </main>
  );
}
