"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordReset,
  type ForgotPasswordActionState,
} from "@/app/actions/auth";
import { useTranslation } from "@/lib/i18n/useTranslation";

const initialState: ForgotPasswordActionState = {};

export function ForgotPasswordForm({ initialLocale }: { initialLocale?: string | null }) {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    initialState,
  );
  const { t } = useTranslation(initialLocale);

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
      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {t(state.error)}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {t("forgotPassword.success")}
        </p>
      ) : null}
      <button
        className="w-full rounded-md bg-sky-700 px-4 py-2 font-medium text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isPending}
        type="submit"
      >
        {isPending ? t("common.loading") : t("forgotPassword.submit")}
      </button>
      <Link className="block text-center text-sm text-sky-700" href="/login">
        {t("forgotPassword.backToLogin")}
      </Link>
    </form>
  );
}
