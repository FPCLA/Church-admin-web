"use client";

import { useEffect, useState } from "react";

export function CalendarHistoryPreview({ isEnglish }: { isEnglish: boolean }) {
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const savedYears: number[] = [];

      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        const match = key?.match(/^calendar-builder-saved-at-(\d{4})$/);
        if (match) {
          savedYears.push(Number(match[1]));
        }
      }

      savedYears.sort((left, right) => right - left);
      setYears(savedYears);
      setSelectedYear(savedYears[0]?.toString() || "");
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  function openPreview() {
    if (!selectedYear) {
      return;
    }

    window.open(`/calendar/preview?year=${selectedYear}`, "_blank", "noopener,noreferrer");
  }

  const hasSavedCalendar = years.length > 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {isEnglish ? "Calendar - Preview" : "行事曆-預覽"}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="calendar-history-year">
            {isEnglish ? "Calendar year" : "行事曆年份"}
          </label>
          <select
            className="min-w-32 rounded border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-100"
            disabled={!hasSavedCalendar}
            id="calendar-history-year"
            onChange={(event) => setSelectedYear(event.target.value)}
            value={selectedYear}
          >
            {!hasSavedCalendar ? (
              <option value="">{isEnglish ? "No saved years" : "尚無儲存年份"}</option>
            ) : null}
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button
            className="rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={!hasSavedCalendar}
            onClick={openPreview}
            type="button"
          >
            {isEnglish ? "Preview" : "預覽"}
          </button>
        </div>
      </div>
      {isLoaded && !hasSavedCalendar ? (
        <p className="mt-4 text-sm text-slate-500">
          {isEnglish ? "No saved annual calendars yet." : "目前沒有已儲存的年度行事曆"}
        </p>
      ) : null}
    </section>
  );
}
