"use client";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LoginForm } from "@/components/LoginForm";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function LoginPageContent({
  initialError,
  initialStatus,
}: {
  initialError?: string;
  initialStatus?: string;
}) {
  const { locale, t } = useTranslation("zh-TW");
  const passwordSetMessage =
    locale === "en"
      ? "Password updated. Please sign in with your email and new password."
      : "\u5bc6\u78bc\u5df2\u66f4\u65b0\uff0c\u8acb\u7528 Email \u548c\u65b0\u5bc6\u78bc\u767b\u5165\u3002";

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
      {initialStatus === "password_set" ? (
        <p className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {passwordSetMessage}
        </p>
      ) : null}
      <LoginForm initialLocale={locale} initialError={initialError} />
      <p className="mt-5 text-sm leading-6 text-slate-500">
        {t("login.noRegistration")}
      </p>
    </section>
  );
}
