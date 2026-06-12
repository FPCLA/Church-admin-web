import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SignOutButton } from "@/components/SignOutButton";
import { requireApprovedProfile } from "@/lib/auth";
import { translate } from "@/lib/i18n/dictionaries";

export default async function DashboardPage() {
  const { profile } = await requireApprovedProfile();
  const t = translate(profile.language_preference);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm font-medium text-sky-700">{t("app.name")}</p>
            <h1 className="text-2xl font-semibold text-slate-950">
              {t("dashboard.title")}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher initialLocale={profile.language_preference} />
            <SignOutButton label={t("common.signOut")} />
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-8 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
          <p className="text-sm font-medium text-slate-500">
            {t("dashboard.welcome")}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            {profile.full_name || profile.email}
          </h2>
          <p className="mt-4 leading-7 text-slate-700">{t("dashboard.phase")}</p>
          <p className="mt-3 leading-7 text-slate-700">
            {t("dashboard.security")}
          </p>
        </article>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-3">
            <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {t("dashboard.statusApproved")}
            </div>
            <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {t("dashboard.statusActive")}
            </div>
          </div>
        </aside>

        <article className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-slate-600 md:col-span-3">
          {t("dashboard.noModules")}
        </article>
      </section>
    </main>
  );
}
