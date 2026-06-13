"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInWithPassword, type LoginActionState } from "@/app/actions/auth";
import { useTranslation } from "@/lib/i18n/useTranslation";

const initialState: LoginActionState = {};

export function LoginForm({
  initialLocale,
  initialError,
}: {
  initialLocale?: string | null;
  initialError?: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    signInWithPassword,
    initialState,
  );
  const { t } = useTranslation(initialLocale);
  const errorKey = state.error || (initialError && `login.errors.${initialError}`);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="email">
          {t("common.email")}
        </label>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label
            className="block text-sm font-medium text-slate-700"
            htmlFor="password"
          >
            {t("common.password")}
          </label>
          <Link className="text-sm text-sky-700" href="/forgot-password">
            {t("login.forgotPassword")}
          </Link>
        </div>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {errorKey ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {t(errorKey)}
        </p>
      ) : null}
      <button
        className="w-full rounded-md bg-sky-700 px-4 py-2 font-medium text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isPending}
        type="submit"
      >
        {isPending ? t("common.loading") : t("common.signIn")}
      </button>
    </form>
  );
}
