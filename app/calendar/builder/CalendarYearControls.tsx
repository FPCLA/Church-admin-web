"use client";

import { useState } from "react";

export function CalendarYearControls({
  hasSavedCalendar,
  isEnglish,
  selectedYear,
  yearOptions,
}: {
  hasSavedCalendar: boolean;
  isEnglish: boolean;
  selectedYear: number;
  yearOptions: number[];
}) {
  const [year, setYear] = useState(selectedYear.toString());

  function openCalendar() {
    window.location.href = `/calendar/builder?year=${year}`;
  }

  function rebuildCalendar() {
    const confirmed = window.confirm(
      isEnglish ? "Are you sure you want to rebuild this calendar?" : "你確定要重新製作嗎?",
    );
    if (!confirmed) {
      return;
    }

    window.location.href = `/calendar/builder?year=${year}&rebuild=1`;
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        {isEnglish ? "Calendar year" : "行事曆年份"}
        <select
          className="min-w-36 rounded border border-slate-300 px-3 py-2"
          onChange={(event) => setYear(event.target.value)}
          value={year}
        >
          {yearOptions.map((optionYear) => (
            <option key={optionYear} value={optionYear}>
              {optionYear}
            </option>
          ))}
        </select>
      </label>
      <button
        className="rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white"
        onClick={openCalendar}
        type="button"
      >
        {isEnglish ? "Build/Edit" : "製作/編輯"}
      </button>
      <button
        className="rounded border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        onClick={rebuildCalendar}
        type="button"
      >
        {hasSavedCalendar
          ? isEnglish
            ? "Rebuild saved calendar"
            : "重新製作已儲存行事曆"
          : isEnglish
            ? "Rebuild"
            : "重新製作"}
      </button>
    </div>
  );
}

