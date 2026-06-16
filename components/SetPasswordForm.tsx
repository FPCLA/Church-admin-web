"use client";

import { useActionState } from "react";
import { setPassword, type SetPasswordActionState } from "@/app/actions/auth";
import { useTranslation } from "@/lib/i18n/useTranslation";

const initialState: SetPasswordActionState = {};

export function SetPasswordForm({ initialLocale }: { initialLocale?: string | null }) {
  const [state, formAction, isPending] = useActionState(setPassword, initialState);
  const { t } = useTranslation(initialLocale);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="password">
          {t("common.password")}
        </label>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="confirm_password">
          {t("setPassword.confirmPassword")}
        </label>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {t(state.error)}
        </p>
      ) : null}
      <button
        className="w-full rounded-md bg-sky-700 px-4 py-2 font-medium text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isPending}
        type="submit"
      >
        {isPending ? t("common.loading") : t("setPassword.submit")}
      </button>
    </form>
  );
}
