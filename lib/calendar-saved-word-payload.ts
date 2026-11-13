import { buildAnnualCalendar, type CalendarSpecialDate, type CalendarSunday } from "@/lib/phase3/calendar-builder";
import type { AnnualCalendarCustomItem, AnnualCalendarRecord } from "@/lib/annual-calendars";
import type { CalendarWordActivityLine, CalendarWordExportPayload } from "@/lib/calendar-word-export-types";
import type { CalendarTheme, ElderAssignment } from "@/app/calendar/builder/CalendarAnnualDetails";
import { bibleBook } from "@/app/calendar/builder/calendar-options";

type AnnualCalendar = { specialDates: CalendarSpecialDate[]; sundays: CalendarSunday[]; year: number };
type CustomCalendarItem = AnnualCalendarCustomItem;
type PresetKind = "joint_service" | "communion";
type PlacementState = Record<string, string | null>;
type SpecialAlignmentState = Record<string, boolean>;
type DisplayRow = {date:string;month:number;sortDate:string;sunday:CalendarSunday;type:"sunday"} | {date:string;month:number;sortDate:string;specialDate:CalendarSpecialDate;type:"special"};
const ownRowPlacement = "__own_row__";
const weekdayZh = ["日", "一", "二", "三", "四", "五", "六"];
const weekdayEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function themeReference(theme: CalendarTheme, english: boolean) {
  const book = bibleBook(theme.bookId);
  if (!book) {
    return "";
  }

  const bookName = english ? book[2] : book[1];
  if (!theme.chapter) {
    return bookName;
  }

  return english
    ? `${bookName} ${theme.chapter}${theme.verse ? `:${theme.verse}` : ""}`
    : `${bookName} ${theme.chapter}章${theme.verse ? `${theme.verse}節` : ""}`;
}

function monthlyElderAssignments(elders: ElderAssignment[], firstMonth: number, lastMonth: number) {
  return Array.from({ length: lastMonth - firstMonth + 1 }, (_, index) => {
    const month = firstMonth + index;
    const name = elders.find((elder) => elder.months.includes(month))?.name.trim() || "";
    return { month, name };
  });
}

function footerMonthShort(month: number) {
  return monthShort(month).replace(".", "");
}

function presetText(kind: PresetKind, isEnglish: boolean) {
  if (kind === "joint_service") {
    return isEnglish ? "Joint Worship" : "聯合禮拜";
  }

  return isEnglish ? "Communion" : "聖餐";
}

function presetCalendarText(kind: PresetKind) {
  return kind === "joint_service" ? "*" : "(聖餐禮 Holy Communion)";
}

function isPresetItem(item: CustomCalendarItem, kind: PresetKind) {
  return (
    item.kind === kind ||
    item.text === presetText(kind, true) ||
    item.text === presetText(kind, false) ||
    (kind === "joint_service" && item.text === "*") ||
    (kind === "joint_service" && item.text === "「 * 」") ||
    item.text === presetCalendarText(kind)
  );
}

function calendarItemText(item: CustomCalendarItem) {
  if (isPresetItem(item, "joint_service")) {
    return presetCalendarText("joint_service");
  }

  if (isPresetItem(item, "communion")) {
    return presetCalendarText("communion");
  }

  return `${item.fellowship || ""}${item.text}`;
}

function sortCalendarItems(items: CustomCalendarItem[]) {
  return [...items].sort((first, second) => calendarItemPriority(first) - calendarItemPriority(second));
}

function calendarItemPriority(item: CustomCalendarItem) {
  if (isPresetItem(item, "joint_service")) {
    return 0;
  }

  if (isPresetItem(item, "communion")) {
    return 1;
  }

  return 2;
}

function formatSundayDay(isoDate: string, isEnglish: boolean) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const day = date.getUTCDate();
  return isEnglish ? `${monthShort(date.getUTCMonth() + 1)} ${day}` : `${day} 日`;
}

function formatSpecialDateDate(isoDate: string | null, isEnglish: boolean) {
  if (!isoDate) {
    return isEnglish ? "TBD" : "待確認";
  }

  const date = new Date(`${isoDate}T00:00:00Z`);
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const weekday = isEnglish ? weekdayEn[date.getUTCDay()] : weekdayZh[date.getUTCDay()];

  return `${month}/${day} (${weekday})`;
}

function formatSpecialDateLabel(
  specialDate: CalendarSpecialDate,
  placedSundayDate: string | null,
  isEnglish: boolean,
) {
  const label = isEnglish ? specialDate.labelEn : specialDate.labelZh;

  if (!specialDate.date) {
    return `${label} (TBD)`;
  }

  if (placedSundayDate === ownRowPlacement) {
    return label;
  }

  if (specialDate.date === placedSundayDate) {
    return label;
  }

  const date = new Date(`${specialDate.date}T00:00:00Z`);
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const weekday = isEnglish ? weekdayEn[date.getUTCDay()] : weekdayZh[date.getUTCDay()];

  return isEnglish ? `${month}/${day} (${weekday}) ${label}` : `${month}/${day}（${weekday}）${label}`;
}

function monthLabel(month: number, isEnglish: boolean) {
  if (isEnglish) {
    return monthShort(month);
  }

  return `${toChineseMonth(month)}  月`;
}

function monthShort(month: number) {
  return ["Jan.", "Feb.", "Mar.", "Apr.", "May.", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."][
    month - 1
  ];
}

function toChineseMonth(month: number) {
  return ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"][month - 1];
}

function dateMonth(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`).getUTCMonth() + 1;
}

function appendWordLine(lines: CalendarWordActivityLine[], text: string, newLine: boolean, side: "left" | "right") {
  if (!text) {
    return;
  }

  if (!lines.length || newLine) {
    lines.push({ left: "", right: "" });
  }

  const line = lines[lines.length - 1];
  line[side] = line[side] ? `${line[side]}  ${text}` : text;
}

export function buildWordExportPayload({
  annualCalendar,
  customItemsBySunday,
  displayRows,
  elders,
  isEnglish,
  placements,
  specialAlignments,
  specialDatesBySunday,
  theme,
}: {
  annualCalendar: AnnualCalendar;
  customItemsBySunday: Map<string, CustomCalendarItem[]>;
  displayRows: DisplayRow[];
  elders: ElderAssignment[];
  isEnglish: boolean;
  placements: PlacementState;
  specialAlignments: SpecialAlignmentState;
  specialDatesBySunday: Map<string, CalendarSpecialDate[]>;
  theme: CalendarTheme;
}): CalendarWordExportPayload {
  const pageRanges = [
    { firstMonth: 1, lastMonth: 6 },
    { firstMonth: 7, lastMonth: 12 },
  ] as const;
  const pages = pageRanges.map(({ firstMonth, lastMonth }) => {
    const pageRows = displayRows.filter((row) => row.month >= firstMonth && row.month <= lastMonth);
    let previousSundayMonth: number | null = null;
    const rows = pageRows.map((row) => {
      if (row.type === "special") {
        return {
          kind: "special" as const,
          text: `${formatSpecialDateDate(row.specialDate.date, isEnglish)} ${formatSpecialDateLabel(row.specialDate, placements[row.specialDate.key] || null, isEnglish)}`,
        };
      }

      const monthStart = previousSundayMonth !== null && previousSundayMonth !== row.month;
      const showMonth = previousSundayMonth !== row.month;
      previousSundayMonth = row.month;
      const sortedItems = sortCalendarItems(customItemsBySunday.get(row.sunday.date) || []);
      const hasJointService = sortedItems.some((item) => isPresetItem(item, "joint_service"));
      const ordinaryItems = sortedItems.filter((item) => !isPresetItem(item, "joint_service"));
      const lines: CalendarWordActivityLine[] = [];

      ordinaryItems
        .filter((item) => item.align !== "right")
        .forEach((item) => appendWordLine(lines, calendarItemText(item), Boolean(item.newLine), "left"));
      (specialDatesBySunday.get(row.sunday.date) || [])
        .filter((specialDate) => specialAlignments[specialDate.key] === false)
        .forEach((specialDate) =>
          appendWordLine(
            lines,
            formatSpecialDateLabel(specialDate, placements[specialDate.key] || null, isEnglish),
            false,
            "left",
          ),
        );
      const rightItems = ordinaryItems
        .filter((item) => item.align === "right")
        .map((item) => calendarItemText(item));
      rightItems.push(
        ...(specialDatesBySunday.get(row.sunday.date) || [])
          .filter((specialDate) => specialAlignments[specialDate.key] !== false)
          .map((specialDate) =>
            formatSpecialDateLabel(specialDate, placements[specialDate.key] || null, isEnglish),
          ),
      );
      rightItems.forEach((text, index) => {
        while (lines.length <= index) {
          lines.push({ left: "", right: "" });
        }
        lines[index].right = text;
      });

      return {
        activityLines: lines.length ? lines : [{ left: "", right: "" }],
        date: `${formatSundayDay(row.sunday.date, isEnglish)}${hasJointService ? "*" : ""}`,
        kind: "sunday" as const,
        month: showMonth ? monthLabel(row.month, isEnglish) : "",
        monthStart,
      };
    });

    return {
      elders: monthlyElderAssignments(elders, firstMonth, lastMonth).map(({ month, name }) => ({
        month: footerMonthShort(month),
        name,
      })),
      rows,
    };
  });

  const chineseReference = themeReference(theme, false);
  const englishReference = themeReference(theme, true);
  return {
    isEnglish,
    pages: [pages[0], pages[1]],
    themeChinese: `${isEnglish ? "Theme:" : "主題："} ${theme.contentZh}${chineseReference ? `（${chineseReference}）` : ""}`,
    themeEnglish: theme.contentEn ? `Theme: ${theme.contentEn}${englishReference ? ` (${englishReference})` : ""}` : "",
    year: annualCalendar.year,
  };
}

export function buildSavedCalendarWordPayload(record: AnnualCalendarRecord, isEnglish: boolean): CalendarWordExportPayload {
  const annualCalendar = buildAnnualCalendar(record.calendarYear);
  const customItemsBySunday = new Map<string, CustomCalendarItem[]>();
  for (const item of record.customItems) {
    const items = customItemsBySunday.get(item.sundayDate) || [];
    items.push(item);
    customItemsBySunday.set(item.sundayDate, items);
  }
  const specialDatesBySunday = new Map<string, CalendarSpecialDate[]>();
  for (const specialDate of annualCalendar.specialDates) {
    const sunday = record.placements[specialDate.key];
    if (!sunday || sunday === ownRowPlacement) continue;
    const dates = specialDatesBySunday.get(sunday) || [];
    dates.push(specialDate);
    specialDatesBySunday.set(sunday, dates);
  }
  const displayRows: DisplayRow[] = annualCalendar.sundays.map((sunday) => ({date: sunday.date, month: sunday.month, sortDate: sunday.date, sunday, type: "sunday"}));
  for (const specialDate of annualCalendar.specialDates) {
    if (specialDate.date && new Date(specialDate.date + "T00:00:00Z").getUTCDay() !== 0 && record.placements[specialDate.key] === ownRowPlacement)
      displayRows.push({date: specialDate.date, month: dateMonth(specialDate.date), sortDate: specialDate.date, specialDate, type: "special"});
  }
  displayRows.sort((a, b) => a.sortDate.localeCompare(b.sortDate) || (a.type === "sunday" ? -1 : 1));
  return buildWordExportPayload({annualCalendar, customItemsBySunday, displayRows, elders:record.annualDetails.elders, isEnglish, placements:record.placements, specialAlignments:record.specialAlignments, specialDatesBySunday, theme:record.annualDetails.theme});
}
