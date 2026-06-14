import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export default function ResetPasswordPage() {
  const locale = "zh-TW";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-sky-700">
              FPCLA 教會行政管理
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              第一次登入 / 重設密碼
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              第一次登入或忘記密碼時，請輸入帳號 Email，系統會寄出設定新密碼的連結。
              <br />
              First sign-in or forgot password? Enter your account email to receive a
              new password setup link.
            </p>
          </div>
          <LanguageSwitcher initialLocale={locale} />
        </div>
        <ForgotPasswordForm initialLocale={locale} />
      </section>
    </main>
  );
}
