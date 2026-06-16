import { translate } from "@/lib/i18n/dictionaries";

export default function OfflinePage() {
  const t = translate("zh-TW");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-sky-700">{t("app.name")}</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">
          {t("offline.title")}
        </h1>
        <p className="mt-3 leading-7 text-slate-600">{t("offline.message")}</p>
      </section>
    </main>
  );
}
