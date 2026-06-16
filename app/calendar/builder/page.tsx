import { Phase3Layout, Phase3Nav } from "@/components/phase3/Phase3Layout";
import { PrintButton } from "@/components/phase3/PrintButton";
import { buildAnnualCalendar } from "@/lib/phase3/calendar-builder";
import { phase3Text } from "@/lib/phase3/config";
import { requireModuleContext } from "@/lib/phase3/data";

type PageProps = {
  searchParams?: Promise<{ year?: string }>;
};

export default async function CalendarBuilderPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const { profile } = await requireModuleContext("calendar_events");
  const p3 = phase3Text(profile.language_preference);
  const currentYear = new Date().getFullYear();
  const selectedYear = normalizeYear(params.year, currentYear + 1);
  const annualCalendar = buildAnnualCalendar(selectedYear);
  const isEnglish = profile.language_preference === "en";
  const yearOptions = Array.from({ length: 9 }, (_, index) => currentYear - 2 + index);

  return (
    <Phase3Layout locale={profile.language_preference} moduleName="calendar_events">
      <Phase3Nav
        backHref="/calendar"
        backLabel={p3.text("back")}
        locale={profile.language_preference}
      />

      <section className="rounded-lg border border-slate-200 bg-white p-4 print:hidden">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <form className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              {isEnglish ? "Calendar year" : "行事曆年份"}
              <select
                className="min-w-36 rounded border border-slate-300 px-3 py-2"
                defaultValue={selectedYear}
                name="year"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <button className="rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white">
              {isEnglish ? "Build" : "製作"}
            </button>
          </form>
          <PrintButton label={isEnglish ? "Print" : "列印"} />
        </div>
      </section>

      <section className="calendar-builder-sheet bg-white text-slate-950">
        <header className="calendar-builder-title">
          <p>First Presbyterian Church of Los Angeles</p>
          <h2>FPCLA {selectedYear} {isEnglish ? "Calendar" : "行事曆"}</h2>
        </header>

        <div className="calendar-builder-holidays">
          {annualCalendar.holidays.map((holiday) => (
            <div key={holiday.key}>
              <span>{isEnglish ? holiday.labelEn : holiday.labelZh}</span>
              <strong>
                {holiday.date} ({isEnglish ? holiday.weekdayEn : holiday.weekdayZh})
              </strong>
            </div>
          ))}
        </div>

        <div className="calendar-builder-grid">
          {annualCalendar.months.map((month) => (
            <table className="calendar-builder-month" key={month.month}>
              <thead>
                <tr>
                  <th colSpan={4}>
                    {month.month} {isEnglish ? "Month" : "月"}
                  </th>
                </tr>
                <tr>
                  <th>{isEnglish ? "No." : "週次"}</th>
                  <th>{isEnglish ? "Date" : "日期"}</th>
                  <th>{isEnglish ? "Day" : "星期"}</th>
                  <th>{isEnglish ? "Notes" : "節期 / 備註"}</th>
                </tr>
              </thead>
              <tbody>
                {month.sundays.map((sunday) => (
                  <tr key={sunday.date}>
                    <td>{sunday.sequence}</td>
                    <td>{sunday.date}</td>
                    <td>{isEnglish ? "Sun" : "主日"}</td>
                    <td>{isEnglish ? sunday.noteEn : sunday.noteZh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
      </section>
    </Phase3Layout>
  );
}

function normalizeYear(rawYear: string | undefined, fallback: number) {
  const year = Number(rawYear);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return fallback;
  }

  return year;
}
