"use client";

import { useEffect, useMemo, useState } from "react";
import type { CalendarSpecialDate, CalendarSunday } from "@/lib/phase3/calendar-builder";

type AnnualCalendar = {
  specialDates: CalendarSpecialDate[];
  sundays: CalendarSunday[];
  year: number;
};

type CalendarBuilderClientProps = {
  annualCalendar: AnnualCalendar;
  isEnglish: boolean;
};

type PlacementState = Record<string, string | null>;
type DraftState = Record<string, string>;
type CustomCalendarItem = {
  id: string;
  sundayDate: string;
  text: string;
};

const weekdayZh = ["\u65e5", "\u4e00", "\u4e8c", "\u4e09", "\u56db", "\u4e94", "\u516d"];
const weekdayEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarBuilderClient({ annualCalendar, isEnglish }: CalendarBuilderClientProps) {
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftState>({});
  const [customItems, setCustomItems] = useState<CustomCalendarItem[]>([]);
  const [placements, setPlacements] = useState<PlacementState>(() => initialPlacements(annualCalendar));
  const customItemsStorageKey = `calendar-builder-custom-items-${annualCalendar.year}`;
  const placementStorageKey = `calendar-builder-placements-${annualCalendar.year}`;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setActiveDate(null);
      setDrafts({});
      setCustomItems(readStorage<CustomCalendarItem[]>(customItemsStorageKey, []));
      setPlacements(readStorage<PlacementState>(placementStorageKey, initialPlacements(annualCalendar)));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [annualCalendar, customItemsStorageKey, placementStorageKey]);

  useEffect(() => {
    window.localStorage.setItem(customItemsStorageKey, JSON.stringify(customItems));
  }, [customItemsStorageKey, customItems]);

  useEffect(() => {
    window.localStorage.setItem(placementStorageKey, JSON.stringify(placements));
  }, [placementStorageKey, placements]);

  const sundayIndexByDate = useMemo(() => {
    return new Map(annualCalendar.sundays.map((sunday, index) => [sunday.date, index]));
  }, [annualCalendar.sundays]);

  const specialDatesBySunday = useMemo(() => {
    const datesBySunday = new Map<string, CalendarSpecialDate[]>();

    for (const specialDate of annualCalendar.specialDates) {
      const sundayDate = placements[specialDate.key];
      if (!sundayDate) {
        continue;
      }

      const dates = datesBySunday.get(sundayDate) || [];
      dates.push(specialDate);
      datesBySunday.set(sundayDate, dates);
    }

    return datesBySunday;
  }, [annualCalendar.specialDates, placements]);

  const customItemsBySunday = useMemo(() => {
    const itemsBySunday = new Map<string, CustomCalendarItem[]>();

    for (const item of customItems) {
      const items = itemsBySunday.get(item.sundayDate) || [];
      items.push(item);
      itemsBySunday.set(item.sundayDate, items);
    }

    return itemsBySunday;
  }, [customItems]);

  function updateDraft(date: string, value: string) {
    setDrafts((current) => ({
      ...current,
      [date]: value,
    }));
  }

  function saveDraft(date: string) {
    const text = drafts[date]?.trim();
    if (!text) {
      return;
    }

    setCustomItems((current) => [
      ...current,
      {
        id: `${date}-${Date.now()}`,
        sundayDate: date,
        text,
      },
    ]);
    setDrafts((current) => ({
      ...current,
      [date]: "",
    }));
    setActiveDate(null);
  }

  function moveCustomItem(id: string, sundayDate: string) {
    setCustomItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              sundayDate,
            }
          : item,
      ),
    );
  }

  function moveCustomItemByWeek(id: string, direction: -1 | 1) {
    const item = customItems.find((current) => current.id === id);
    if (!item) {
      return;
    }

    const currentIndex = sundayIndexByDate.get(item.sundayDate);
    if (currentIndex === undefined) {
      return;
    }

    const nextSunday = annualCalendar.sundays[currentIndex + direction];
    if (nextSunday) {
      moveCustomItem(id, nextSunday.date);
    }
  }

  function deleteCustomItem(id: string) {
    setCustomItems((current) => current.filter((item) => item.id !== id));
  }

  function moveSpecialDate(key: string, direction: -1 | 1) {
    setPlacements((current) => {
      const sundayDate = current[key];
      if (!sundayDate) {
        return current;
      }

      const currentIndex = sundayIndexByDate.get(sundayDate);
      if (currentIndex === undefined) {
        return current;
      }

      const nextSunday = annualCalendar.sundays[currentIndex + direction];
      if (!nextSunday) {
        return current;
      }

      return {
        ...current,
        [key]: nextSunday.date,
      };
    });
  }

  return (
    <section className="calendar-builder-sheet bg-white text-slate-950">
      <header className="calendar-builder-title">
        <h2>
          {annualCalendar.year} {isEnglish ? "FPCLA Calendar" : "\u5e74\u6d1b\u6749\u78ef\u53f0\u7063\u57fa\u7763\u9577\u8001\u6559\u6703\u884c\u4e8b\u66c6"}{" "}
          <span>FPCLA Calendar</span>
        </h2>
        <p>{isEnglish ? "Theme:" : "\u4e3b\u984c\uff1a"}</p>
      </header>

      <div className="calendar-builder-linear-wrap">
        <table className="calendar-builder-linear">
          <thead>
            <tr>
              <th>{isEnglish ? "Month" : "\u6708"}</th>
              <th>{isEnglish ? "Sunday" : "\u4e3b\u65e5"}</th>
              <th>{isEnglish ? "Church calendar" : "\u6559\u6703\u884c\u4e8b"}</th>
              <th>{isEnglish ? "Special dates / holidays" : "\u7279\u6b8a\u65e5\u5b50 / \u7bc0\u65e5"}</th>
            </tr>
          </thead>
          <tbody>
            {annualCalendar.sundays.map((sunday, index) => {
              const rowSpecialDates = specialDatesBySunday.get(sunday.date) || [];
              const isFirstMonthRow =
                index === 0 || annualCalendar.sundays[index - 1]?.month !== sunday.month;
              const isEditing = activeDate === sunday.date;

              return (
                <tr
                  className={isEditing ? "is-editing" : ""}
                  key={sunday.date}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    const itemId = event.dataTransfer.getData("text/calendar-custom-item");
                    if (itemId) {
                      moveCustomItem(itemId, sunday.date);
                    }
                  }}
                >
                  <td className="calendar-builder-month-label">
                    {isFirstMonthRow ? monthLabel(sunday.month, isEnglish) : ""}
                  </td>
                  <td className="calendar-builder-sunday-date">
                    <button type="button" onClick={() => setActiveDate(sunday.date)}>
                      {formatSundayDay(sunday.date, isEnglish)}
                    </button>
                  </td>
                  <td className="calendar-builder-note-cell" onClick={() => setActiveDate(sunday.date)}>
                    <div className="calendar-builder-custom-items">
                      {(customItemsBySunday.get(sunday.date) || []).map((item) => (
                        <div className="calendar-builder-custom-item" key={item.id}>
                          <button
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.setData("text/calendar-custom-item", item.id);
                            }}
                            type="button"
                          >
                            {item.text}
                          </button>
                          <span className="calendar-builder-special-actions print:hidden">
                            <button onClick={() => moveCustomItemByWeek(item.id, -1)} type="button">
                              {isEnglish ? "Prev" : "\u4e0a\u9031"}
                            </button>
                            <button onClick={() => moveCustomItemByWeek(item.id, 1)} type="button">
                              {isEnglish ? "Next" : "\u4e0b\u9031"}
                            </button>
                            <select
                              aria-label={isEnglish ? "Move item to Sunday" : "\u79fb\u5230\u5176\u4ed6\u4e3b\u65e5"}
                              onChange={(event) => moveCustomItem(item.id, event.target.value)}
                              value={item.sundayDate}
                            >
                              {annualCalendar.sundays.map((targetSunday) => (
                                <option key={targetSunday.date} value={targetSunday.date}>
                                  {targetSunday.date}
                                </option>
                              ))}
                            </select>
                            <button onClick={() => deleteCustomItem(item.id)} type="button">
                              {isEnglish ? "Delete" : "\u522a\u9664"}
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>
                    {isEditing ? (
                      <div className="calendar-builder-note-editor">
                        <textarea
                          autoFocus
                          onChange={(event) => updateDraft(sunday.date, event.target.value)}
                          onKeyDown={(event) => {
                            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                              saveDraft(sunday.date);
                            }
                          }}
                          placeholder={isEnglish ? "Type church calendar item" : "\u8f38\u5165\u6559\u6703\u884c\u4e8b"}
                          value={drafts[sunday.date] || ""}
                        />
                        <div className="calendar-builder-editor-actions print:hidden">
                          <button onClick={() => saveDraft(sunday.date)} type="button">
                            {isEnglish ? "Add" : "\u52a0\u5165"}
                          </button>
                          <button onClick={() => setActiveDate(null)} type="button">
                            {isEnglish ? "Cancel" : "\u53d6\u6d88"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button">
                        {isEnglish ? "Add item" : "\u65b0\u589e\u5167\u5bb9"}
                      </button>
                    )}
                  </td>
                  <td className="calendar-builder-special-cell">
                    {rowSpecialDates.map((specialDate) => (
                      <div className="calendar-builder-special-item" key={specialDate.key}>
                        <span>
                          {formatSpecialDateLabel(
                            specialDate,
                            placements[specialDate.key] || null,
                            isEnglish,
                          )}
                        </span>
                        <span className="calendar-builder-special-actions print:hidden">
                          <button
                            aria-label={isEnglish ? "Move to previous week" : "\u79fb\u5230\u4e0a\u4e00\u9031"}
                            disabled={sundayIndexByDate.get(placements[specialDate.key] || "") === 0}
                            onClick={() => moveSpecialDate(specialDate.key, -1)}
                            type="button"
                          >
                            {isEnglish ? "Prev" : "\u4e0a\u9031"}
                          </button>
                          <button
                            aria-label={isEnglish ? "Move to next week" : "\u79fb\u5230\u4e0b\u4e00\u9031"}
                            disabled={
                              sundayIndexByDate.get(placements[specialDate.key] || "") ===
                              annualCalendar.sundays.length - 1
                            }
                            onClick={() => moveSpecialDate(specialDate.key, 1)}
                            type="button"
                          >
                            {isEnglish ? "Next" : "\u4e0b\u9031"}
                          </button>
                        </span>
                      </div>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function initialPlacements(annualCalendar: AnnualCalendar) {
  return Object.fromEntries(
    annualCalendar.specialDates.map((specialDate) => [specialDate.key, specialDate.sundayDate]),
  );
}

function readStorage<T>(key: string, fallback: T) {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatSundayDay(isoDate: string, isEnglish: boolean) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const day = date.getUTCDate();
  return isEnglish ? `${monthShort(date.getUTCMonth() + 1)} ${day}` : `${day} \u65e5`;
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

  if (specialDate.date === placedSundayDate) {
    return label;
  }

  const date = new Date(`${specialDate.date}T00:00:00Z`);
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const weekday = isEnglish ? weekdayEn[date.getUTCDay()] : weekdayZh[date.getUTCDay()];

  return isEnglish ? `${month}/${day} (${weekday}) ${label}` : `${month}/${day}\uff08${weekday}\uff09${label}`;
}

function monthLabel(month: number, isEnglish: boolean) {
  if (isEnglish) {
    return monthShort(month);
  }

  return `${toChineseMonth(month)}  \u6708`;
}

function monthShort(month: number) {
  return ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."][
    month - 1
  ];
}

function toChineseMonth(month: number) {
  return ["\u4e00", "\u4e8c", "\u4e09", "\u56db", "\u4e94", "\u516d", "\u4e03", "\u516b", "\u4e5d", "\u5341", "\u5341\u4e00", "\u5341\u4e8c"][
    month - 1
  ];
}
