"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { updateLanguagePreference } from "@/app/actions/language";
import { normalizeLocale, translate, type Locale } from "./dictionaries";

const storageKey = "church-admin-locale";
const localeEventName = "church-admin-locale-change";

export function useTranslation(initialLocale?: string | null) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const storedLocale = window.localStorage.getItem(storageKey);
      if (storedLocale) {
        return normalizeLocale(storedLocale);
      }
    }

    return normalizeLocale(initialLocale || process.env.NEXT_PUBLIC_DEFAULT_LOCALE);
  });

  useEffect(() => {
    const handleLocaleChange = (event: Event) => {
      const nextLocale = (event as CustomEvent<string>).detail;
      setLocaleState(normalizeLocale(nextLocale));
    };

    window.addEventListener(localeEventName, handleLocaleChange);

    return () => {
      window.removeEventListener(localeEventName, handleLocaleChange);
    };
  }, []);

  const setLocale = useCallback(async (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(storageKey, nextLocale);
    window.dispatchEvent(
      new CustomEvent(localeEventName, { detail: nextLocale }),
    );
    await updateLanguagePreference(nextLocale);
  }, []);

  const t = useMemo(() => translate(locale), [locale]);

  return { locale, setLocale, t };
}
