import Link from "next/link";
import { CalendarHistoryPreview } from "./CalendarHistoryPreview";
import { Phase3Layout, Phase3Nav } from "@/components/phase3/Phase3Layout";
import { requireModuleContext } from "@/lib/calendar-access";
import { getAnnualCalendarSummaries } from "@/lib/annual-calendars-data";

export default async function CalendarPage() {
  const { profile, permissions } = await requireModuleContext("calendar_events");
  const calendars = await getAnnualCalendarSummaries();
  const english = profile.language_preference === "en";
  return (
    <Phase3Layout locale={profile.language_preference} moduleName="calendar_events">
      <Phase3Nav backLabel={english ? "Back" : "返回"} locale={profile.language_preference} />
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{english ? "Annual calendar" : "年度行事曆"}</h2>
        <p className="mt-2 text-slate-600">{english ? "Create the church calendar, edit dates and activities, then save or export it to Word." : "建立教會年度行事曆、編輯日期與活動，完成後可儲存或匯出 Word。"}</p>
        <Link className="mt-4 inline-block rounded bg-sky-700 px-4 py-2 font-medium text-white" href="/calendar/builder">
          {english ? (permissions.create || permissions.edit ? "New / Edit" : "View calendar") : (permissions.create || permissions.edit ? "新建／編輯" : "檢視行事曆")}
        </Link>
      </section>
      <CalendarHistoryPreview isEnglish={english} years={calendars.map((calendar) => calendar.calendarYear)} />
    </Phase3Layout>
  );
}
