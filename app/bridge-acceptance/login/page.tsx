import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function BridgeAcceptanceLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="w-full max-w-md space-y-5 rounded-lg border bg-white p-6">
        <h1 className="text-2xl font-semibold">FPCLA acceptance sign-in / 驗收登入</h1>
        <p>Use your existing church website account. This page stops after sign-in and does not open the dashboard. / 請使用既有網站帳號；登入後停留於本頁。</p>
        <LoginForm initialLocale="en" bridgeLogin />
      </section>
    </main>
  );
}
