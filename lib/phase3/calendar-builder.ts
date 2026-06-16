export type CalendarHoliday = {
  key: string;
  labelZh: string;
  labelEn: string;
  date: string;
  weekdayZh: string;
  weekdayEn: string;
};

export type CalendarSunday = {
  date: string;
  month: number;
  day: number;
  sequence: number;
  noteZh: string;
  noteEn: string;
};

const weekdayZh = ["日", "一", "二", "三", "四", "五", "六"];
const weekdayEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function buildAnnualCalendar(year: number) {
  const holidays = buildHolidays(year);
  const holidayByDate = new Map(holidays.map((holiday) => [holiday.date, holiday]));
  const sundays: CalendarSunday[] = [];
  const date = new Date(Date.UTC(year, 0, 1));

  while (date.getUTCDay() !== 0) {
    date.setUTCDate(date.getUTCDate() + 1);
  }

  while (date.getUTCFullYear() === year) {
    const isoDate = toIsoDate(date);
    const holiday = holidayByDate.get(isoDate);
    sundays.push({
      date: isoDate,
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      sequence: sundays.length + 1,
      noteZh: holiday?.labelZh || "",
      noteEn: holiday?.labelEn || "",
    });
    date.setUTCDate(date.getUTCDate() + 7);
  }

  return {
    holidays,
    months: Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      return {
        month,
        sundays: sundays.filter((sunday) => sunday.month === month),
      };
    }),
    sundays,
    year,
  };
}

function buildHolidays(year: number): CalendarHoliday[] {
  return [
    holiday("mothers_day", "母親節", "Mother's Day", nthWeekdayOfMonth(year, 5, 0, 2)),
    holiday("fathers_day", "父親節", "Father's Day", nthWeekdayOfMonth(year, 6, 0, 3)),
    holiday("thanksgiving", "感恩節", "Thanksgiving", nthWeekdayOfMonth(year, 11, 4, 4)),
    holiday("christmas", "聖誕節", "Christmas", new Date(Date.UTC(year, 11, 25))),
  ];
}

function holiday(key: string, labelZh: string, labelEn: string, date: Date): CalendarHoliday {
  return {
    key,
    labelZh,
    labelEn,
    date: toIsoDate(date),
    weekdayZh: weekdayZh[date.getUTCDay()],
    weekdayEn: weekdayEn[date.getUTCDay()],
  };
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number) {
  const date = new Date(Date.UTC(year, month - 1, 1));
  const offset = (weekday - date.getUTCDay() + 7) % 7;
  date.setUTCDate(1 + offset + (nth - 1) * 7);
  return date;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
