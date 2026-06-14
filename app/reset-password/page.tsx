import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SetPasswordForm } from "@/components/SetPasswordForm";
import { getCurrentUserAndProfile } from "@/lib/auth";

export default async function ResetPasswordPage() {
  const { user, profile } = await getCurrentUserAndProfile();
  const locale = profile?.language_preference || user?.user_metadata?.locale || "zh-TW";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-sky-700">
              FPCLA 教會行政管理
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              設定新密碼 / Set new password
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              請輸入新密碼與確認密碼，完成後即可使用新密碼登入。
              <br />
              Enter and confirm your new password. You can sign in with it afterward.
            </p>
          </div>
          <LanguageSwitcher initialLocale={locale} />
        </div>
        <SetPasswordForm initialLocale={locale} />
      </section>
    </main>
  );
}
