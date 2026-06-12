"use client";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LoginForm } from "@/components/LoginForm";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function LoginPageContent({ initialError }: { initialError?: string }) {
  const { locale, t } = useTranslation("zh-TW");

  return (
    <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-sky-700">{t("app.name")}</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            {t("login.title")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {t("login.subtitle")}
          </p>
        </div>
        <LanguageSwitcher initialLocale={locale} />
      </div>
      <LoginForm initialLocale={locale} initialError={initialError} />
      <p className="mt-5 text-sm leading-6 text-slate-500">
        {t("login.noRegistration")}
      </p>
    </section>
  );
}
