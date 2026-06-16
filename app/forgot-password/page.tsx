import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { translate } from "@/lib/i18n/dictionaries";

export default function ForgotPasswordPage() {
  const locale = "zh-TW";
  const t = translate(locale);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-sky-700">{t("app.name")}</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              {t("forgotPassword.title")}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {t("forgotPassword.subtitle")}
            </p>
          </div>
          <LanguageSwitcher initialLocale={locale} />
        </div>
        <ForgotPasswordForm initialLocale={locale} />
      </section>
    </main>
  );
}
