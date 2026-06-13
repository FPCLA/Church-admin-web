import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SignOutButton } from "@/components/SignOutButton";
import { adminModules } from "@/lib/admin/constants";
import { requireApprovedProfile } from "@/lib/auth";
import { translate } from "@/lib/i18n/dictionaries";
import { hasPermission } from "@/lib/permissions";

type PageProps = { params: Promise<{ moduleName: string }> };

export default async function ModuleComingSoonPage({ params }: PageProps) {
  const { moduleName } = await params;
  const { user, profile } = await requireApprovedProfile();
  const t = translate(profile.language_preference);

  if (!adminModules.some((item) => item === moduleName)) {
    redirect("/dashboard");
  }

  if (!(await hasPermission(user.id, moduleName, "preview"))) {
    redirect("/dashboard?error=unauthorized");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4"><div><p className="text-sm font-medium text-sky-700">{t("app.name")}</p><h1 className="text-2xl font-semibold text-slate-950">{t(`modules.${moduleName}`)}</h1></div><div className="flex items-center gap-3"><LanguageSwitcher initialLocale={profile.language_preference} /><SignOutButton label={t("common.signOut")} /></div></div></header>
      <section className="mx-auto max-w-3xl px-4 py-8"><div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-slate-700">{t("common.comingSoon")}</div><a className="mt-4 inline-block text-sky-700" href="/dashboard">{t("dashboard.title")}</a></section>
    </main>
  );
}
