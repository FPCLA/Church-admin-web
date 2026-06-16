"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { Locale } from "@/lib/i18n/dictionaries";

export function LanguageSwitcher({
  initialLocale,
}: {
  initialLocale?: string | null;
}) {
  const { locale, setLocale, t } = useTranslation(initialLocale);
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleLocaleChange(nextLocale: Locale) {
    setIsUpdating(true);
    await setLocale(nextLocale);
    router.refresh();
    setIsUpdating(false);
  }

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span>{t("common.language")}</span>
      <select
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 shadow-sm"
        disabled={isUpdating}
        value={locale}
        onChange={(event) => {
          void handleLocaleChange(event.target.value as Locale);
        }}
      >
        <option value="zh-TW">{t("common.zhTW")}</option>
        <option value="en">{t("common.en")}</option>
      </select>
    </label>
  );
}
