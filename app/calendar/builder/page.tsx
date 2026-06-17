import { Phase3Layout, Phase3Nav } from "@/components/phase3/Phase3Layout";
import { PrintButton } from "@/components/phase3/PrintButton";
import { buildAnnualCalendar, type CalendarDateStatus } from "@/lib/phase3/calendar-builder";
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
              {isEnglish ? "Calendar year" : "\u884c\u4e8b\u66c6\u5e74\u4efd"}
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
              {isEnglish ? "Build and confirm dates" : "\u88fd\u4f5c\u4e26\u78ba\u8a8d\u65e5\u671f"}
            </button>
          </form>
          <PrintButton label={isEnglish ? "Print" : "\u5217\u5370"} />
        </div>
      </section>

      <section className="calendar-builder-sheet bg-white text-slate-950">
        <header className="calendar-builder-title">
          <p>First Presbyterian Church of Los Angeles</p>
          <h2>
            FPCLA {selectedYear} {isEnglish ? "Calendar" : "\u884c\u4e8b\u66c6"}
          </h2>
        </header>

        <section className="calendar-builder-confirmation">
          <div className="calendar-builder-section-title">
            {isEnglish ? "Date confirmation" : "\u65e5\u671f\u78ba\u8a8d"}
          </div>
          <table>
            <thead>
              <tr>
                <th>{isEnglish ? "Item" : "\u9805\u76ee"}</th>
                <th>{isEnglish ? "Date" : "\u65e5\u671f"}</th>
                <th>{isEnglish ? "Day" : "\u661f\u671f"}</th>
                <th>{isEnglish ? "Method / source" : "\u8a08\u7b97\u65b9\u5f0f / \u4f86\u6e90"}</th>
                <th>{isEnglish ? "Sunday note" : "\u4e3b\u65e5\u5099\u8a3b\u4f4d\u7f6e"}</th>
                <th>{isEnglish ? "Status" : "\u72c0\u614b"}</th>
              </tr>
            </thead>
            <tbody>
              {annualCalendar.specialDates.map((date) => (
                <tr key={date.key}>
                  <td>{isEnglish ? date.labelEn : date.labelZh}</td>
                  <td>{date.date || "TBD"}</td>
                  <td>{isEnglish ? date.weekdayEn : date.weekdayZh}</td>
                  <td>{isEnglish ? date.methodEn : date.methodZh}</td>
                  <td>{isEnglish ? date.sundayPlacementEn : date.sundayPlacementZh}</td>
                  <td>{statusLabel(date.status, isEnglish)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="calendar-builder-grid">
          {annualCalendar.months.map((month) => (
            <table className="calendar-builder-month" key={month.month}>
              <thead>
                <tr>
                  <th colSpan={4}>
                    {month.month} {isEnglish ? "Month" : "\u6708"}
                  </th>
                </tr>
                <tr>
                  <th>{isEnglish ? "No." : "\u9031\u6b21"}</th>
                  <th>{isEnglish ? "Date" : "\u65e5\u671f"}</th>
                  <th>{isEnglish ? "Day" : "\u661f\u671f"}</th>
                  <th>{isEnglish ? "Notes" : "\u7bc0\u671f / \u5099\u8a3b"}</th>
                </tr>
              </thead>
              <tbody>
                {month.sundays.map((sunday) => (
                  <tr key={sunday.date}>
                    <td>{sunday.sequence}</td>
                    <td>{sunday.date}</td>
                    <td>{isEnglish ? "Sun" : "\u4e3b\u65e5"}</td>
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

function statusLabel(status: CalendarDateStatus, isEnglish: boolean) {
  if (status === "needs_confirmation") {
    return isEnglish ? "Confirm manually" : "\u9700\u4eba\u5de5\u78ba\u8a8d";
  }

  if (status === "known") {
    return isEnglish ? "Known date" : "\u5df2\u77e5\u65e5\u671f";
  }

  return isEnglish ? "Calculated" : "\u81ea\u52d5\u8a08\u7b97";
}
