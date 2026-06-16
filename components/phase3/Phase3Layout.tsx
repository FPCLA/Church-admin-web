import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SignOutButton } from "@/components/SignOutButton";
import { translate } from "@/lib/i18n/dictionaries";
import { phase3Text, type Phase3ModuleName } from "@/lib/phase3/config";

export function Phase3Layout({
  children,
  locale,
  moduleName,
}: {
  children: React.ReactNode;
  locale?: string | null;
  moduleName: Phase3ModuleName;
}) {
  const t = translate(locale);
  const p3 = phase3Text(locale);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm font-medium text-sky-700">{t("app.name")}</p>
            <h1 className="text-2xl font-semibold text-slate-950">
              {p3.module(moduleName)}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher initialLocale={locale || "zh-TW"} />
            <SignOutButton label={t("common.signOut")} />
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6">{children}</section>
    </main>
  );
}

export function Phase3Nav({
  backHref,
  backLabel,
  locale,
  status,
}: {
  backHref?: string;
  backLabel: string;
  locale?: string | null;
  status?: string;
}) {
  const t = translate(locale);

  return (
    <>
      <nav className="flex flex-wrap gap-2 text-sm">
        <a className="rounded border border-slate-200 bg-white px-3 py-2" href="/dashboard">
          {t("dashboard.title")}
        </a>
        {backHref && (
          <a className="rounded border border-slate-200 bg-white px-3 py-2" href={backHref}>
            {backLabel}
          </a>
        )}
      </nav>
      {status && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {status}
        </div>
      )}
    </>
  );
}
