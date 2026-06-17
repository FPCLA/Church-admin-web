export type CalendarDateStatus = "calculated" | "known" | "needs_confirmation";

export type CalendarSpecialDate = {
  key: string;
  labelZh: string;
  labelEn: string;
  date: string | null;
  weekdayZh: string;
  weekdayEn: string;
  sundayDate: string | null;
  sundayPlacementZh: string;
  sundayPlacementEn: string;
  status: CalendarDateStatus;
  methodZh: string;
  methodEn: string;
  showOnSundayTable: boolean;
};

type CalendarSundayPlacementRule = "none" | "same" | "previous" | "next" | "nearest";

export type CalendarSunday = {
  date: string;
  month: number;
  day: number;
  sequence: number;
  noteZh: string;
  noteEn: string;
};

const weekdayZh = ["\u65e5", "\u4e00", "\u4e8c", "\u4e09", "\u56db", "\u4e94", "\u516d"];
const weekdayEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const knownOscarDates: Record<number, string> = {
  2026: "2026-03-15",
  2027: "2027-03-14",
  2028: "2028-03-05",
};

const knownLaMarathonDates: Record<number, string> = {
  2024: "2024-03-17",
  2025: "2025-03-16",
  2026: "2026-03-08",
};

export function buildAnnualCalendar(year: number) {
  const specialDates = buildSpecialDates(year);
  const notesByDate = new Map<string, CalendarSpecialDate[]>();

  for (const specialDate of specialDates) {
    if (specialDate.showOnSundayTable && specialDate.sundayDate) {
      const notes = notesByDate.get(specialDate.sundayDate) || [];
      notes.push(specialDate);
      notesByDate.set(specialDate.sundayDate, notes);
    }
  }

  const sundays: CalendarSunday[] = [];
  const date = new Date(Date.UTC(year, 0, 1));

  while (date.getUTCDay() !== 0) {
    date.setUTCDate(date.getUTCDate() + 1);
  }

  while (date.getUTCFullYear() === year) {
    const isoDate = toIsoDate(date);
    const notes = notesByDate.get(isoDate) || [];
    sundays.push({
      date: isoDate,
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      sequence: sundays.length + 1,
      noteZh: notes.map((note) => note.labelZh).join(" / "),
      noteEn: notes.map((note) => note.labelEn).join(" / "),
    });
    date.setUTCDate(date.getUTCDate() + 7);
  }

  return {
    months: Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      return {
        month,
        sundays: sundays.filter((sunday) => sunday.month === month),
      };
    }),
    specialDates,
    sundays,
    year,
  };
}

function buildSpecialDates(year: number): CalendarSpecialDate[] {
  const easter = getEasterDate(year);
  const adventOne = firstSundayOnOrAfter(new Date(Date.UTC(year, 10, 27)));
  const lunarNewYear = findChineseCalendarDate(year, 1, 1, 1, 15, 2, 25);
  const dragonBoat = findChineseCalendarDate(year, 5, 5, 5, 15, 6, 30);
  const midAutumn = findChineseCalendarDate(year, 8, 15, 9, 1, 10, 15);

  return [
    specialDate(
      "new_years_day",
      "\u5143\u65e6",
      "New Year's Day",
      new Date(Date.UTC(year, 0, 1)),
      "calculated",
      "1 \u6708 1 \u65e5",
      "January 1",
      true,
      "next",
    ),
    specialDate(
      "chinese_new_year",
      "\u6625\u7bc0",
      "Chinese New Year",
      lunarNewYear,
      "calculated",
      "\u8fb2\u66c6\u6b63\u6708\u521d\u4e00",
      "Chinese lunar calendar: month 1 day 1",
      true,
      "next",
    ),
    specialDate(
      "la_marathon",
      "LA Marathon",
      "LA Marathon",
      knownLaMarathonDates[year] || null,
      knownLaMarathonDates[year] ? "known" : "needs_confirmation",
      knownLaMarathonDates[year] ? "\u5df2\u77e5\u65e5\u671f" : "\u5b98\u65b9\u6bcf\u5e74\u516c\u5e03\uff0c\u8acb\u518d\u78ba\u8a8d",
      knownLaMarathonDates[year] ? "Known published date" : "Published annually; confirm official date",
      true,
      "same",
    ),
    specialDate(
      "oscars",
      "Oscar Award (Hollywood Road Closure)",
      "Oscar Award (Hollywood Road Closure)",
      knownOscarDates[year] || null,
      knownOscarDates[year] ? "known" : "needs_confirmation",
      knownOscarDates[year] ? "\u5df2\u77e5\u65e5\u671f" : "\u5b98\u65b9\u6bcf\u5e74\u516c\u5e03\uff0c\u8acb\u518d\u78ba\u8a8d",
      knownOscarDates[year] ? "Known published date" : "Published annually; confirm official date",
      true,
      "same",
    ),
    specialDate(
      "palm_sunday",
      "\u68d5\u6a39\u7bc0",
      "Palm Sunday",
      addDays(easter, -7),
      "calculated",
      "\u5fa9\u6d3b\u7bc0\u524d\u4e00\u500b\u4e3b\u65e5",
      "One Sunday before Easter",
      true,
      "same",
    ),
    specialDate(
      "good_friday",
      "\u8036\u7a4c\u53d7\u96e3\u65e5",
      "Good Friday",
      addDays(easter, -2),
      "calculated",
      "\u5fa9\u6d3b\u7bc0\u524d\u5169\u5929",
      "Two days before Easter",
      true,
      "previous",
    ),
    specialDate(
      "easter",
      "\u5fa9\u6d3b\u7bc0",
      "Easter",
      easter,
      "calculated",
      "\u897f\u65b9\u6559\u6703\u5fa9\u6d3b\u7bc0\u516c\u5f0f",
      "Western ecclesiastical Easter calculation",
      true,
      "same",
    ),
    specialDate(
      "mothers_day",
      "\u6bcd\u89aa\u7bc0",
      "Mother's Day",
      nthWeekdayOfMonth(year, 5, 0, 2),
      "calculated",
      "5 \u6708\u7b2c\u4e8c\u500b\u4e3b\u65e5",
      "Second Sunday of May",
      true,
      "same",
    ),
    specialDate(
      "memorial_day",
      "Memorial Day",
      "Memorial Day",
      lastWeekdayOfMonth(year, 5, 1),
      "calculated",
      "5 \u6708\u6700\u5f8c\u4e00\u500b\u661f\u671f\u4e00",
      "Last Monday of May",
      true,
      "previous",
    ),
    specialDate(
      "dragon_boat",
      "\u7aef\u5348\u7bc0",
      "Dragon Boat Festival",
      dragonBoat,
      "calculated",
      "\u8fb2\u66c6\u4e94\u6708\u521d\u4e94",
      "Chinese lunar calendar: month 5 day 5",
      true,
      "next",
    ),
    specialDate(
      "fathers_day",
      "\u7236\u89aa\u7bc0",
      "Father's Day",
      nthWeekdayOfMonth(year, 6, 0, 3),
      "calculated",
      "6 \u6708\u7b2c\u4e09\u500b\u4e3b\u65e5",
      "Third Sunday of June",
      true,
      "same",
    ),
    specialDate(
      "independence_day",
      "\u7368\u7acb\u7d00\u5ff5\u65e5",
      "Independence Day",
      new Date(Date.UTC(year, 6, 4)),
      "calculated",
      "7 \u6708 4 \u65e5",
      "July 4",
      true,
      "nearest",
    ),
    specialDate(
      "labor_day",
      "Labor Day",
      "Labor Day",
      nthWeekdayOfMonth(year, 9, 1, 1),
      "calculated",
      "9 \u6708\u7b2c\u4e00\u500b\u661f\u671f\u4e00",
      "First Monday of September",
      true,
      "previous",
    ),
    specialDate(
      "mid_autumn",
      "\u4e2d\u79cb\u7bc0",
      "Mid-Autumn Festival",
      midAutumn,
      "calculated",
      "\u8fb2\u66c6\u516b\u6708\u5341\u4e94",
      "Chinese lunar calendar: month 8 day 15",
      true,
      "next",
    ),
    specialDate(
      "world_communion_day",
      "\u4e16\u754c\u8056\u9910\u65e5",
      "World Communion Day",
      nthWeekdayOfMonth(year, 10, 0, 1),
      "calculated",
      "10 \u6708\u7b2c\u4e00\u500b\u4e3b\u65e5",
      "First Sunday of October",
      true,
      "same",
    ),
    specialDate(
      "thanksgiving",
      "\u611f\u6069\u7bc0",
      "Thanksgiving",
      nthWeekdayOfMonth(year, 11, 4, 4),
      "calculated",
      "11 \u6708\u7b2c\u56db\u500b\u661f\u671f\u56db",
      "Fourth Thursday of November",
      true,
      "previous",
    ),
    ...[0, 1, 2, 3].map((index) =>
      specialDate(
        `advent_${index + 1}`,
        `\u5f85\u964d\u4e3b\u65e5 (${toChineseOrdinal(index + 1)})`,
        `Advent Sunday (${index + 1})`,
        addDays(adventOne, index * 7),
        "calculated",
        "\u5f85\u964d\u7bc0\u7b2c\u4e00\u4e3b\u65e5\u70ba 11/27 \u81f3 12/3 \u4e4b\u9593\u7684\u4e3b\u65e5",
        "Advent I is the Sunday between Nov 27 and Dec 3",
        true,
        "same",
      ),
    ),
    specialDate(
      "christmas",
      "\u8056\u8a95\u7bc0",
      "Christmas",
      new Date(Date.UTC(year, 11, 25)),
      "calculated",
      "12 \u6708 25 \u65e5",
      "December 25",
      true,
      "previous",
    ),
  ].sort((a, b) => (a.date || "9999-99-99").localeCompare(b.date || "9999-99-99"));
}

function specialDate(
  key: string,
  labelZh: string,
  labelEn: string,
  date: Date | string | null,
  status: CalendarDateStatus,
  methodZh: string,
  methodEn: string,
  showOnSundayTable: boolean,
  sundayPlacementRule: CalendarSundayPlacementRule,
): CalendarSpecialDate {
  const isoDate = date ? (typeof date === "string" ? date : toIsoDate(date)) : null;
  const day = isoDate ? new Date(`${isoDate}T00:00:00Z`).getUTCDay() : 0;
  const sundayPlacement = resolveSundayPlacement(isoDate, sundayPlacementRule);

  return {
    key,
    labelZh,
    labelEn,
    date: isoDate,
    weekdayZh: isoDate ? weekdayZh[day] : "",
    weekdayEn: isoDate ? weekdayEn[day] : "",
    sundayDate: sundayPlacement.sundayDate,
    sundayPlacementZh: sundayPlacement.sundayPlacementZh,
    sundayPlacementEn: sundayPlacement.sundayPlacementEn,
    status,
    methodZh,
    methodEn,
    showOnSundayTable,
  };
}

function resolveSundayPlacement(
  isoDate: string | null,
  rule: CalendarSundayPlacementRule,
): Pick<CalendarSpecialDate, "sundayDate" | "sundayPlacementZh" | "sundayPlacementEn"> {
  if (!isoDate) {
    return {
      sundayDate: null,
      sundayPlacementZh: "\u65e5\u671f\u5f85\u78ba\u8a8d\u5f8c\u653e\u5165\u4e3b\u65e5\u8868",
      sundayPlacementEn: "Add to Sunday table after the date is confirmed",
    };
  }

  if (rule === "none") {
    return {
      sundayDate: null,
      sundayPlacementZh: "\u4e0d\u653e\u5165\u4e3b\u65e5\u5099\u8a3b",
      sundayPlacementEn: "Not shown in Sunday notes",
    };
  }

  const date = new Date(`${isoDate}T00:00:00Z`);
  const year = date.getUTCFullYear();
  const day = date.getUTCDay();
  const previous = addDays(date, day === 0 ? 0 : -day);
  const next = addDays(date, day === 0 ? 0 : 7 - day);
  let sunday = date;

  if (rule === "previous") {
    sunday = previous.getUTCFullYear() === year ? previous : next;
  } else if (rule === "next") {
    sunday = next.getUTCFullYear() === year ? next : previous;
  } else if (rule === "nearest") {
    const previousDistance = Math.abs(daysBetween(previous, date));
    const nextDistance = Math.abs(daysBetween(next, date));
    sunday = previousDistance < nextDistance ? previous : next;
    if (sunday.getUTCFullYear() !== year) {
      sunday = sunday === previous ? next : previous;
    }
  } else {
    sunday = day === 0 ? date : previous;
  }

  const sundayDate = toIsoDate(sunday);

  if (sundayDate === isoDate) {
    return {
      sundayDate,
      sundayPlacementZh: "\u540c\u4e00\u500b\u4e3b\u65e5",
      sundayPlacementEn: "Same Sunday",
    };
  }

  if (sunday < date) {
    return {
      sundayDate,
      sundayPlacementZh: `\u653e\u5728\u524d\u4e00\u500b\u4e3b\u65e5 ${sundayDate}`,
      sundayPlacementEn: `Sunday before: ${sundayDate}`,
    };
  }

  return {
    sundayDate,
    sundayPlacementZh: `\u653e\u5728\u5f8c\u4e00\u500b\u4e3b\u65e5 ${sundayDate}`,
    sundayPlacementEn: `Sunday after: ${sundayDate}`,
  };
}

function getEasterDate(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function findChineseCalendarDate(
  relatedYear: number,
  lunarMonth: number,
  lunarDay: number,
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
) {
  const formatter = new Intl.DateTimeFormat("en-US-u-ca-chinese", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
  const date = new Date(Date.UTC(relatedYear, startMonth - 1, startDay));
  const end = new Date(Date.UTC(relatedYear, endMonth - 1, endDay));

  while (date <= end) {
    const parts = formatter.formatToParts(date);
    const month = numericPart(parts, "month");
    const day = numericPart(parts, "day");
    const year = numericPart(parts, "relatedYear");

    if (year === relatedYear && month === lunarMonth && day === lunarDay) {
      return new Date(date);
    }

    date.setUTCDate(date.getUTCDate() + 1);
  }

  return null;
}

function numericPart(parts: Intl.DateTimeFormatPart[], type: string) {
  const value = parts.find((part) => part.type === type)?.value || "";
  const digits = value.match(/\d+/)?.[0];
  return digits ? Number(digits) : null;
}

function firstSundayOnOrAfter(date: Date) {
  const copy = new Date(date);
  while (copy.getUTCDay() !== 0) {
    copy.setUTCDate(copy.getUTCDate() + 1);
  }
  return copy;
}

function lastWeekdayOfMonth(year: number, month: number, weekday: number) {
  const date = new Date(Date.UTC(year, month, 0));
  while (date.getUTCDay() !== weekday) {
    date.setUTCDate(date.getUTCDate() - 1);
  }
  return date;
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number) {
  const date = new Date(Date.UTC(year, month - 1, 1));
  const offset = (weekday - date.getUTCDay() + 7) % 7;
  date.setUTCDate(1 + offset + (nth - 1) * 7);
  return date;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function daysBetween(first: Date, second: Date) {
  return Math.round((first.getTime() - second.getTime()) / 86400000);
}

function toChineseOrdinal(value: number) {
  return ["\u4e00", "\u4e8c", "\u4e09", "\u56db"][value - 1] || String(value);
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
