"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ForgotPasswordForm({ initialLocale }: { initialLocale?: string | null }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { t } = useTranslation(initialLocale);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();

    if (!email) {
      setError("forgotPassword.errors.required");
      return;
    }

    setIsPending(true);
    const supabase = createSupabaseBrowserClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setIsPending(false);

    if (resetError) {
      setError("forgotPassword.errors.sendFailed");
      return;
    }

    setSuccess(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {t(error)}
        </p>
      ) : null}
      {success ? (
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
