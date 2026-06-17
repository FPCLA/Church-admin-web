"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type SpecialPlacement = string | null;
type PlacementState = Record<string, SpecialPlacement>;
type DraftState = Record<string, string>;
type PresetKind = "joint_service" | "communion";

type CustomCalendarItem = {
  id: string;
  sundayDate: string;
  text: string;
  kind?: PresetKind | "custom";
};

type DisplayRow =
  | {
      date: string;
      month: number;
      sortDate: string;
      sunday: CalendarSunday;
      type: "sunday";
    }
  | {
      date: string;
      month: number;
      sortDate: string;
      specialDate: CalendarSpecialDate;
      type: "special";
    };

const ownRowPlacement = "__own_row__";
const weekdayZh = ["日", "一", "二", "三", "四", "五", "六"];
const weekdayEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarBuilderClient({ annualCalendar, isEnglish }: CalendarBuilderClientProps) {
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftState>({});
  const [customItems, setCustomItems] = useState<CustomCalendarItem[]>([]);
  const [placements, setPlacements] = useState<PlacementState>(() => initialPlacements(annualCalendar));
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const editorRef = useRef<HTMLDivElement | null>(null);
  const customItemsStorageKey = `calendar-builder-custom-items-${annualCalendar.year}`;
  const placementStorageKey = `calendar-builder-placements-${annualCalendar.year}`;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setActiveDate(null);
      setDrafts({});
      setCustomItems(readStorage<CustomCalendarItem[]>(customItemsStorageKey, []));
      setPlacements(readStorage<PlacementState>(placementStorageKey, initialPlacements(annualCalendar)));
      setSavedAt(window.localStorage.getItem(saveTimeStorageKey(annualCalendar.year)));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [annualCalendar, customItemsStorageKey, placementStorageKey]);

  useEffect(() => {
    window.localStorage.setItem(customItemsStorageKey, JSON.stringify(customItems));
  }, [customItemsStorageKey, customItems]);

  useEffect(() => {
    window.localStorage.setItem(placementStorageKey, JSON.stringify(placements));
  }, [placementStorageKey, placements]);

  useEffect(() => {
    function closeDateMenus(event: MouseEvent | TouchEvent) {
      const target = event.target;
      if (target instanceof Element && target.closest(".calendar-builder-date-menu")) {
        return;
      }

      document
        .querySelectorAll<HTMLDetailsElement>(".calendar-builder-date-menu[open]")
        .forEach((menu) => menu.removeAttribute("open"));
    }

    document.addEventListener("mousedown", closeDateMenus);
    document.addEventListener("touchstart", closeDateMenus);

    return () => {
      document.removeEventListener("mousedown", closeDateMenus);
      document.removeEventListener("touchstart", closeDateMenus);
    };
  }, []);

  useEffect(() => {
    if (!activeDate) {
      return;
    }

    const editingDate = activeDate;

    function closeEmptyEditor(event: MouseEvent | TouchEvent) {
      const target = event.target;
      if (!(target instanceof Node) || editorRef.current?.contains(target)) {
        return;
      }

      if (!(drafts[editingDate] || "").trim()) {
        clearDraftAndClose(editingDate);
      }
    }

    document.addEventListener("mousedown", closeEmptyEditor);
    document.addEventListener("touchstart", closeEmptyEditor);

    return () => {
      document.removeEventListener("mousedown", closeEmptyEditor);
      document.removeEventListener("touchstart", closeEmptyEditor);
    };
  }, [activeDate, drafts]);

  const sundayIndexByDate = useMemo(() => {
    return new Map(annualCalendar.sundays.map((sunday, index) => [sunday.date, index]));
  }, [annualCalendar.sundays]);

  const specialDatesBySunday = useMemo(() => {
    const datesBySunday = new Map<string, CalendarSpecialDate[]>();

    for (const specialDate of annualCalendar.specialDates) {
      const sundayDate = placements[specialDate.key];
      if (!isSundayPlacement(sundayDate)) {
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

  const displayRows = useMemo(() => {
    const rows: DisplayRow[] = annualCalendar.sundays.map((sunday) => ({
      date: sunday.date,
      month: sunday.month,
      sortDate: sunday.date,
      sunday,
      type: "sunday",
    }));

    for (const specialDate of annualCalendar.specialDates) {
      if (
        specialDate.date &&
        isNonSundaySpecialDate(specialDate) &&
        placements[specialDate.key] === ownRowPlacement
      ) {
        rows.push({
          date: specialDate.date,
          month: dateMonth(specialDate.date),
          sortDate: specialDate.date,
          specialDate,
          type: "special",
        });
      }
    }

    return rows.sort((first, second) => {
      const dateComparison = first.sortDate.localeCompare(second.sortDate);
      if (dateComparison !== 0) {
        return dateComparison;
      }

      return first.type === "sunday" ? -1 : 1;
    });
  }, [annualCalendar.specialDates, annualCalendar.sundays, placements]);

  function updateDraft(date: string, value: string) {
    setDrafts((current) => ({
      ...current,
      [date]: value,
    }));
  }

  function saveDraft(date: string) {
    const text = drafts[date]?.trim();
    if (!text) {
      clearDraftAndClose(date);
      return;
    }

    setCustomItems((current) => [
      ...current,
      {
        id: `${date}-${Date.now()}`,
        kind: "custom",
        sundayDate: date,
        text,
      },
    ]);
    clearDraftAndClose(date);
  }

  function clearDraftAndClose(date: string) {
    setDrafts((current) => ({
      ...current,
      [date]: "",
    }));
    setActiveDate(null);
  }

  function setDatePreset(sundayDate: string, kind: PresetKind, checked: boolean) {
    const label = presetText(kind, isEnglish);

    if (!checked) {
      setCustomItems((current) =>
        current.filter(
          (item) => item.sundayDate !== sundayDate || !isPresetItem(item, kind),
        ),
      );
      setStatusMessage(isEnglish ? `Removed ${label} from ${sundayDate}.` : `${sundayDate} 已取消${label}。`);
      return;
    }

    setCustomItems((current) => {
      if (hasDatePreset(current, sundayDate, kind)) {
        return current;
      }

      return [
        ...current,
        { id: `${sundayDate}-${kind}-${Date.now()}`, kind, sundayDate, text: presetCalendarText(kind) },
      ];
    });
    setStatusMessage(isEnglish ? `Added ${label} to ${sundayDate}.` : `${sundayDate} 已加入${label}。`);
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

  function setSpecialDateMode(key: string, mode: "own" | "previous" | "next") {
    const specialDate = annualCalendar.specialDates.find((current) => current.key === key);
    if (!specialDate?.date) {
      return;
    }

    const sundayDate =
      mode === "own"
        ? ownRowPlacement
        : mode === "previous"
          ? previousSundayForDate(specialDate.date, annualCalendar.sundays)
          : nextSundayForDate(specialDate.date, annualCalendar.sundays);

    if (!sundayDate) {
      return;
    }

    setPlacements((current) => ({
      ...current,
      [key]: sundayDate,
    }));
  }

  function moveSpecialDate(key: string, direction: -1 | 1) {
    setPlacements((current) => {
      const specialDate = annualCalendar.specialDates.find((candidate) => candidate.key === key);
      const currentSundayDate = current[key];
      const fallbackSundayDate =
        specialDate?.date && direction === -1
          ? previousSundayForDate(specialDate.date, annualCalendar.sundays)
          : specialDate?.date
            ? nextSundayForDate(specialDate.date, annualCalendar.sundays)
            : null;
      const sundayDate = isSundayPlacement(currentSundayDate) ? currentSundayDate : fallbackSundayDate;
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

  function saveCalendar() {
    const nextSavedAt = new Date().toLocaleString(isEnglish ? "en-US" : "zh-TW");
    window.localStorage.setItem(customItemsStorageKey, JSON.stringify(customItems));
    window.localStorage.setItem(placementStorageKey, JSON.stringify(placements));
    window.localStorage.setItem(saveTimeStorageKey(annualCalendar.year), nextSavedAt);
    setSavedAt(nextSavedAt);
    setStatusMessage(isEnglish ? "Calendar saved." : "行事曆已儲存。");
  }

  function openPreview() {
    saveCalendar();
    const previewWindow = window.open("", `fpcla-calendar-${annualCalendar.year}`, "width=1000,height=800");
    if (!previewWindow) {
      setStatusMessage(isEnglish ? "Allow pop-ups to preview." : "請允許彈出視窗後再預覽。");
      return;
    }

    previewWindow.document.open();
    previewWindow.document.write(
      buildPreviewHtml({
        annualCalendar,
        customItemsBySunday,
        displayRows,
        isEnglish,
        placements,
        specialDatesBySunday,
      }),
    );
    previewWindow.document.close();
    previewWindow.focus();
  }

  return (
    <section className="calendar-builder-sheet bg-white text-slate-950">
      <div className="calendar-builder-toolbar print:hidden">
        <div className="calendar-builder-save-panel">
          <button onClick={saveCalendar} type="button">
            {isEnglish ? "Save" : "儲存"}
          </button>
          <button onClick={openPreview} type="button">
            {isEnglish ? "Preview" : "預覽"}
          </button>
          <span>
            {savedAt
              ? isEnglish
                ? `Saved: ${savedAt}`
                : `已儲存：${savedAt}`
              : isEnglish
                ? "Not saved yet"
                : "尚未儲存"}
          </span>
        </div>
        {statusMessage ? <p>{statusMessage}</p> : null}
      </div>

      <header className="calendar-builder-title">
        <h2>
          {annualCalendar.year} {isEnglish ? "FPCLA Calendar" : "年洛杉磯台灣基督長老教會行事曆"}{" "}
          <span>FPCLA Calendar</span>
        </h2>
        <p>{isEnglish ? "Theme:" : "主題："}</p>
      </header>

      <div className="calendar-builder-linear-wrap">
        <table className="calendar-builder-linear">
          <thead>
            <tr>
              <th>{isEnglish ? "Month" : "月"}</th>
              <th>{isEnglish ? "Sunday" : "主日"}</th>
              <th>{isEnglish ? "Church calendar" : "教會行事"}</th>
              <th>{isEnglish ? "Special dates / holidays" : "特殊日子 / 節日"}</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, index) => {
              const isFirstMonthRow = index === 0 || displayRows[index - 1]?.month !== row.month;

              if (row.type === "special") {
                return (
                  <tr className="calendar-builder-own-special-row" key={`special-${row.specialDate.key}`}>
                    <td className="calendar-builder-month-label">
                      {isFirstMonthRow ? monthLabel(row.month, isEnglish) : ""}
                    </td>
                    <td className="calendar-builder-sunday-date calendar-builder-special-date-label">
                      {formatSpecialDateDate(row.specialDate.date, isEnglish)}
                    </td>
                    <td className="calendar-builder-note-cell" />
                    <td className="calendar-builder-special-cell">
                      {renderSpecialDateItem(row.specialDate, placements[row.specialDate.key] || null)}
                    </td>
                  </tr>
                );
              }

              const sunday = row.sunday;
              const rowSpecialDates = specialDatesBySunday.get(sunday.date) || [];
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
                    <details className="calendar-builder-date-menu print:hidden">
                      <summary>{isEnglish ? "Service options" : "聖餐／聯合禮拜"}</summary>
                      <div className="calendar-builder-date-menu-options">
                        {(["communion", "joint_service"] as const).map((kind) => (
                          <label key={kind}>
                            <input
                              checked={hasDatePreset(customItems, sunday.date, kind)}
                              onChange={(event) => setDatePreset(sunday.date, kind, event.target.checked)}
                              type="checkbox"
                            />
                            <span>{presetText(kind, isEnglish)}</span>
                          </label>
                        ))}
                      </div>
                    </details>
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
                            {calendarItemText(item)}
                          </button>
                          <span className="calendar-builder-special-actions print:hidden">
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                moveCustomItemByWeek(item.id, -1);
                              }}
                              type="button"
                            >
                              {isEnglish ? "Prev" : "上週"}
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                moveCustomItemByWeek(item.id, 1);
                              }}
                              type="button"
                            >
                              {isEnglish ? "Next" : "下週"}
                            </button>
                            <select
                              aria-label={isEnglish ? "Move item to Sunday" : "移到其他主日"}
                              onChange={(event) => moveCustomItem(item.id, event.target.value)}
                              onClick={(event) => event.stopPropagation()}
                              value={item.sundayDate}
                            >
                              {annualCalendar.sundays.map((targetSunday) => (
                                <option key={targetSunday.date} value={targetSunday.date}>
                                  {targetSunday.date}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteCustomItem(item.id);
                              }}
                              type="button"
                            >
                              {isEnglish ? "Delete" : "刪除"}
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>
                    {isEditing ? (
                      <div className="calendar-builder-note-editor" ref={editorRef}>
                        <textarea
                          autoFocus
                          onChange={(event) => updateDraft(sunday.date, event.target.value)}
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => {
                            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                              saveDraft(sunday.date);
                            }
                          }}
                          placeholder={isEnglish ? "Type church calendar item" : "輸入教會行事"}
                          value={drafts[sunday.date] || ""}
                        />
                        <div className="calendar-builder-editor-actions print:hidden">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              saveDraft(sunday.date);
                            }}
                            type="button"
                          >
                            {isEnglish ? "Add" : "加入"}
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              clearDraftAndClose(sunday.date);
                            }}
                            type="button"
                          >
                            {isEnglish ? "Cancel" : "取消"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button">
                        {isEnglish ? "Add item" : "新增內容"}
                      </button>
                    )}
                  </td>
                  <td className="calendar-builder-special-cell">
                    {rowSpecialDates.map((specialDate) =>
                      renderSpecialDateItem(specialDate, placements[specialDate.key] || null),
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <footer className="calendar-builder-footnote">* 代表聯合禮拜 (* denotes Joint Service)</footer>
    </section>
  );

  function renderSpecialDateItem(specialDate: CalendarSpecialDate, placedSundayDate: string | null) {
    const placedOnOwnRow = placedSundayDate === ownRowPlacement;
    const previousSunday = specialDate.date ? previousSundayForDate(specialDate.date, annualCalendar.sundays) : null;
    const nextSunday = specialDate.date ? nextSundayForDate(specialDate.date, annualCalendar.sundays) : null;
    const isNonSunday = isNonSundaySpecialDate(specialDate);

    return (
      <div className="calendar-builder-special-item" key={specialDate.key}>
        <span>{formatSpecialDateLabel(specialDate, placedSundayDate, isEnglish)}</span>
        <span className="calendar-builder-special-actions print:hidden">
          {isNonSunday ? (
            <button
              aria-pressed={placedOnOwnRow}
              onClick={() => setSpecialDateMode(specialDate.key, "own")}
              type="button"
            >
              {isEnglish ? "Own row" : "自成一行"}
            </button>
          ) : null}
          <button
            aria-label={isEnglish ? "Move to previous week" : "移到前一週"}
            aria-pressed={placedSundayDate === previousSunday}
            disabled={!previousSunday}
            onClick={() =>
              isNonSunday ? setSpecialDateMode(specialDate.key, "previous") : moveSpecialDate(specialDate.key, -1)
            }
            type="button"
          >
            {isEnglish ? "Prev" : "前週"}
          </button>
          <button
            aria-label={isEnglish ? "Move to next week" : "移到後一週"}
            aria-pressed={placedSundayDate === nextSunday}
            disabled={!nextSunday}
            onClick={() =>
              isNonSunday ? setSpecialDateMode(specialDate.key, "next") : moveSpecialDate(specialDate.key, 1)
            }
            type="button"
          >
            {isEnglish ? "Next" : "後週"}
          </button>
        </span>
      </div>
    );
  }
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

function saveTimeStorageKey(year: number) {
  return `calendar-builder-saved-at-${year}`;
}

function isSundayPlacement(value: SpecialPlacement): value is string {
  return Boolean(value && value !== ownRowPlacement);
}

function isNonSundaySpecialDate(specialDate: CalendarSpecialDate) {
  return Boolean(specialDate.date && new Date(`${specialDate.date}T00:00:00Z`).getUTCDay() !== 0);
}

function previousSundayForDate(isoDate: string, sundays: CalendarSunday[]) {
  const sunday = [...sundays].reverse().find((candidate) => candidate.date <= isoDate);
  return sunday?.date || null;
}

function nextSundayForDate(isoDate: string, sundays: CalendarSunday[]) {
  const sunday = sundays.find((candidate) => candidate.date >= isoDate);
  return sunday?.date || null;
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
    item.text === presetCalendarText(kind)
  );
}

function hasDatePreset(items: CustomCalendarItem[], sundayDate: string, kind: PresetKind) {
  return items.some((item) => item.sundayDate === sundayDate && isPresetItem(item, kind));
}

function calendarItemText(item: CustomCalendarItem) {
  if (isPresetItem(item, "joint_service")) {
    return presetCalendarText("joint_service");
  }

  if (isPresetItem(item, "communion")) {
    return presetCalendarText("communion");
  }

  return item.text;
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

  return isEnglish ? `${month}/${day} (${weekday})` : `${month}/${day}（${weekday}）`;
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
  return ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."][
    month - 1
  ];
}

function toChineseMonth(month: number) {
  return ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"][month - 1];
}

function dateMonth(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`).getUTCMonth() + 1;
}

function buildPreviewHtml({
  annualCalendar,
  customItemsBySunday,
  displayRows,
  isEnglish,
  placements,
  specialDatesBySunday,
}: {
  annualCalendar: AnnualCalendar;
  customItemsBySunday: Map<string, CustomCalendarItem[]>;
  displayRows: DisplayRow[];
  isEnglish: boolean;
  placements: PlacementState;
  specialDatesBySunday: Map<string, CalendarSpecialDate[]>;
}) {
  const rows = displayRows
    .map((row, index) => {
      const showMonth = index === 0 || displayRows[index - 1]?.month !== row.month;
      const month = showMonth ? monthLabel(row.month, isEnglish) : "";

      if (row.type === "special") {
        return tableRow([
          month,
          formatSpecialDateDate(row.specialDate.date, isEnglish),
          "",
          formatSpecialDateLabel(row.specialDate, placements[row.specialDate.key] || null, isEnglish),
        ]);
      }

      const customItems = (customItemsBySunday.get(row.sunday.date) || []).map(calendarItemText);
      const specialItems = (specialDatesBySunday.get(row.sunday.date) || []).map((specialDate) =>
        formatSpecialDateLabel(specialDate, placements[specialDate.key] || null, isEnglish),
      );

      return tableRow([month, formatSundayDay(row.sunday.date, isEnglish), customItems, specialItems]);
    })
    .join("");

  return `<!doctype html>
<html lang="${isEnglish ? "en" : "zh-Hant"}">
<head>
  <meta charset="utf-8" />
  <title>${annualCalendar.year} FPCLA Calendar</title>
  <style>
    * { box-sizing: border-box; }
    body {
      background: #f8fafc;
      color: #0f172a;
      font-family: Arial, "Noto Sans TC", "Microsoft JhengHei", sans-serif;
      margin: 0;
      padding: 24px;
    }
    .actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin: 0 auto 12px;
      max-width: 8.5in;
    }
    button {
      background: white;
      border: 1px solid #94a3b8;
      border-radius: 4px;
      color: #0f172a;
      font: inherit;
      padding: 8px 12px;
    }
    .sheet {
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      font-family: "Times New Roman", "PMingLiU", Arial, sans-serif;
      margin: 0 auto;
      max-width: 8.5in;
      padding: 0.45in 0.55in;
    }
    .title {
      border-bottom: 2px dashed #111827;
      margin-bottom: 12px;
      padding-bottom: 10px;
      text-align: center;
    }
    .title h1 {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 26px;
    }
    .title p {
      color: #334155;
      font-size: 13px;
      font-weight: 700;
      margin: 0;
    }
    table {
      border-collapse: collapse;
      table-layout: fixed;
      width: 100%;
    }
    th {
      background: #f8fafc;
      border-bottom: 2px solid #334155;
      font-size: 13px;
      padding: 5px 6px;
      text-align: left;
    }
    td {
      border-bottom: 1px solid #475569;
      font-size: 15px;
      line-height: 1.25;
      min-height: 34px;
      padding: 5px 6px;
      vertical-align: top;
    }
    th:nth-child(1), td:nth-child(1), th:nth-child(2), td:nth-child(2) {
      text-align: center;
      width: 14%;
    }
    th:nth-child(3), td:nth-child(3), th:nth-child(4), td:nth-child(4) {
      width: 36%;
    }
    .cell-lines {
      display: grid;
      gap: 4px;
    }
    .footnote {
      font-family: Arial, "Noto Sans TC", "Microsoft JhengHei", sans-serif;
      font-size: 12px;
      margin-top: 12px;
    }
    @media print {
      body { background: white; padding: 0; }
      .actions { display: none; }
      .sheet { border: 0; max-width: none; padding: 0.2in; }
      @page { margin: 0.35in; size: letter portrait; }
    }
  </style>
</head>
<body>
  <div class="actions"><button onclick="window.print()">${isEnglish ? "Print" : "列印"}</button></div>
  <main class="sheet">
    <header class="title">
      <h1>${annualCalendar.year} ${isEnglish ? "FPCLA Calendar" : "年洛杉磯台灣基督長老教會行事曆"} <span>FPCLA Calendar</span></h1>
      <p>${isEnglish ? "Theme:" : "主題："}</p>
    </header>
    <table>
      <thead>
        <tr>
          <th>${isEnglish ? "Month" : "月"}</th>
          <th>${isEnglish ? "Sunday" : "主日"}</th>
          <th>${isEnglish ? "Church calendar" : "教會行事"}</th>
          <th>${isEnglish ? "Special dates / holidays" : "特殊日子 / 節日"}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <footer class="footnote">* 代表聯合禮拜 (* denotes Joint Service)</footer>
  </main>
</body>
</html>`;
}

function tableRow(cells: Array<string | string[]>) {
  return `<tr>${cells
    .map((cell) => {
      if (Array.isArray(cell)) {
        return `<td><div class="cell-lines">${cell.map((line) => `<div>${escapeHtml(line)}</div>`).join("")}</div></td>`;
      }

      return `<td>${escapeHtml(cell)}</td>`;
    })
    .join("")}</tr>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
