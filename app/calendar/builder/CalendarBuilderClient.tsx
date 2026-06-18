"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CalendarSpecialDate, CalendarSunday } from "@/lib/phase3/calendar-builder";
import {
  CalendarAnnualDetails,
  type CalendarTheme,
  type ElderAssignment,
} from "./CalendarAnnualDetails";
import { bibleBook } from "./calendar-options";

type AnnualCalendar = {
  specialDates: CalendarSpecialDate[];
  sundays: CalendarSunday[];
  year: number;
};

type CalendarBuilderClientProps = {
  annualCalendar: AnnualCalendar;
  isEnglish: boolean;
  readOnly?: boolean;
};

type SpecialPlacement = string | null;
type PlacementState = Record<string, SpecialPlacement>;
type DraftState = Record<string, string>;
type PresetKind = "joint_service" | "communion";

type AnnualDetailsState = {
  elders: ElderAssignment[];
  theme: CalendarTheme;
};

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
const emptyTheme: CalendarTheme = {
  bookId: "",
  chapter: "",
  contentEn: "",
  contentZh: "",
  verse: "",
};
const weekdayZh = ["日", "一", "二", "三", "四", "五", "六"];
const weekdayEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarBuilderClient({ annualCalendar, isEnglish, readOnly = false }: CalendarBuilderClientProps) {
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftState>({});
  const [customItems, setCustomItems] = useState<CustomCalendarItem[]>([]);
  const [elders, setElders] = useState<ElderAssignment[]>([
    { id: "elder-1", months: [], name: "" },
  ]);
  const [placements, setPlacements] = useState<PlacementState>(() => initialPlacements(annualCalendar));
  const [theme, setTheme] = useState<CalendarTheme>(emptyTheme);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const customItemsStorageKey = `calendar-builder-custom-items-${annualCalendar.year}`;
  const placementStorageKey = `calendar-builder-placements-${annualCalendar.year}`;
  const annualDetailsStorageKey = `calendar-builder-annual-details-${annualCalendar.year}`;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setActiveDate(null);
      setDrafts({});
      setCustomItems(readStorage<CustomCalendarItem[]>(customItemsStorageKey, []));
      setPlacements(readStorage<PlacementState>(placementStorageKey, initialPlacements(annualCalendar)));
      const annualDetails = readStorage<AnnualDetailsState>(annualDetailsStorageKey, {
        elders: [{ id: "elder-1", months: [], name: "" }],
        theme: emptyTheme,
      });
      setElders(annualDetails.elders);
      setTheme(annualDetails.theme);
      setSavedAt(window.localStorage.getItem(saveTimeStorageKey(annualCalendar.year)));
      setIsStorageLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [annualCalendar, annualDetailsStorageKey, customItemsStorageKey, placementStorageKey]);

  useEffect(() => {
    if (!isStorageLoaded) {
      return;
    }

    window.localStorage.setItem(customItemsStorageKey, JSON.stringify(customItems));
  }, [customItemsStorageKey, customItems, isStorageLoaded]);

  useEffect(() => {
    if (!isStorageLoaded) {
      return;
    }

    window.localStorage.setItem(placementStorageKey, JSON.stringify(placements));
  }, [isStorageLoaded, placementStorageKey, placements]);

  useEffect(() => {
    if (!isStorageLoaded) {
      return;
    }

    window.localStorage.setItem(annualDetailsStorageKey, JSON.stringify({ elders, theme }));
  }, [annualDetailsStorageKey, elders, isStorageLoaded, theme]);

  useEffect(() => {
    function closeDateMenus(event: MouseEvent | TouchEvent) {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(".calendar-builder-date-menu, .calendar-builder-month-menu")
      ) {
        return;
      }

      document
        .querySelectorAll<HTMLDetailsElement>(
          ".calendar-builder-date-menu[open], .calendar-builder-month-menu[open]",
        )
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

  function moveCustomItemWithinDate(id: string, direction: -1 | 1) {
    setCustomItems((current) => {
      const item = current.find((candidate) => candidate.id === id);
      if (!item) {
        return current;
      }

      const peers = current.filter(
        (candidate) =>
          candidate.sundayDate === item.sundayDate &&
          calendarItemPriority(candidate) === calendarItemPriority(item),
      );
      const peerIndex = peers.findIndex((candidate) => candidate.id === id);
      const targetPeer = peers[peerIndex + direction];
      if (!targetPeer) {
        return current;
      }

      const itemIndex = current.findIndex((candidate) => candidate.id === id);
      const targetIndex = current.findIndex((candidate) => candidate.id === targetPeer.id);
      const next = [...current];
      [next[itemIndex], next[targetIndex]] = [next[targetIndex], next[itemIndex]];
      return next;
    });
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
    window.localStorage.setItem(annualDetailsStorageKey, JSON.stringify({ elders, theme }));
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
        elders,
        isEnglish,
        placements,
        specialDatesBySunday,
        theme,
      }),
    );
    previewWindow.document.close();
    previewWindow.focus();
  }

  if (readOnly) {
    if (!isStorageLoaded) {
      return <p className="text-sm text-slate-500">{isEnglish ? "Loading calendar..." : "載入行事曆中..."}</p>;
    }

    return (
      <iframe
        className="calendar-builder-preview-frame"
        srcDoc={buildPreviewHtml({
          annualCalendar,
          customItemsBySunday,
          displayRows,
          elders,
          isEnglish,
          placements,
          specialDatesBySunday,
          theme,
        })}
        title={`${annualCalendar.year} ${isEnglish ? "calendar preview" : "行事曆預覽"}`}
      />
    );
  }

  const editorPages = [
    { firstMonth: 1, lastMonth: 6, rows: displayRows.filter((row) => row.month <= 6) },
    { firstMonth: 7, lastMonth: 12, rows: displayRows.filter((row) => row.month >= 7) },
  ];

  return (
    <div className="calendar-builder-workspace text-slate-950">
      <div className="calendar-builder-toolbar print:hidden">
        <div className="calendar-builder-save-panel">
          <button className="calendar-builder-primary-action" onClick={saveCalendar} type="button">
            {isEnglish ? "Save" : "儲存"}
          </button>
          <button className="calendar-builder-primary-action" onClick={openPreview} type="button">
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
        <CalendarAnnualDetails
          elders={elders}
          isEnglish={isEnglish}
          setElders={setElders}
          setTheme={setTheme}
          theme={theme}
        />
      </div>

      {editorPages.map((page) => (
      <section
        className="calendar-builder-sheet calendar-builder-editor-page bg-white"
        key={page.firstMonth}
      >

      <header className="calendar-builder-title">
        <h2>
          {annualCalendar.year} {isEnglish ? "FPCLA Calendar" : "年洛杉磯台灣基督長老教會行事曆"}{" "}
          <span>FPCLA Calendar</span>
        </h2>
        <CalendarThemeDisplay isEnglish={isEnglish} theme={theme} />
      </header>

      <div className="calendar-builder-linear-wrap">
        <table className="calendar-builder-linear">
          <thead>
            <tr>
              <th>{isEnglish ? "Month" : "月"}</th>
              <th>{isEnglish ? "Sunday" : "主日"}</th>
              <th>{isEnglish ? "Church calendar" : "教會行事"}</th>
              <th>{readOnly ? "" : isEnglish ? "Special dates / holidays" : "特殊日子 / 節日"}</th>
            </tr>
          </thead>
          <tbody>
            {page.rows.map((row, index) => {
              const previousSundayRow = [...page.rows.slice(0, index)]
                .reverse()
                .find((candidate) => candidate.type === "sunday");
              const isFirstMonthRow =
                row.type === "sunday" && previousSundayRow?.month !== row.month;
              const isMonthStart = Boolean(previousSundayRow && isFirstMonthRow);

              if (row.type === "special") {
                return (
                  <tr className="calendar-builder-own-special-row" key={`special-${row.specialDate.key}`}>
                    <td className="calendar-builder-own-special-line" colSpan={4}>
                      <span className="calendar-builder-special-date-label">
                        {formatSpecialDateDate(row.specialDate.date, isEnglish)}
                      </span>
                      {renderSpecialDateItem(row.specialDate, placements[row.specialDate.key] || null)}
                    </td>
                  </tr>
                );
              }

              const sunday = row.sunday;
              const rowSpecialDates = specialDatesBySunday.get(sunday.date) || [];
              const isEditing = !readOnly && activeDate === sunday.date;

              return (
                <tr
                  className={`${isEditing ? "is-editing" : ""}${isMonthStart ? " calendar-builder-month-start" : ""}`.trim()}
                  key={sunday.date}
                  onDragOver={readOnly ? undefined : (event) => event.preventDefault()}
                  onDrop={readOnly ? undefined : (event) => {
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
                    {!readOnly ? <details className="calendar-builder-date-menu print:hidden">
                      <summary>聖/聯</summary>
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
                    </details> : null}
                    {readOnly ? (
                      <span>{formatSundayDay(sunday.date, isEnglish)}</span>
                    ) : (
                      <button type="button" onClick={() => setActiveDate(sunday.date)}>
                        {formatSundayDay(sunday.date, isEnglish)}
                      </button>
                    )}
                  </td>
                  <td
                    className="calendar-builder-note-cell"
                    onClick={readOnly ? undefined : () => setActiveDate(sunday.date)}
                  >
                    <div className="calendar-builder-custom-items">
                      {sortCalendarItems(customItemsBySunday.get(sunday.date) || []).map((item) => (
                        <div className="calendar-builder-custom-item" key={item.id}>
                          {readOnly ? (
                            <span>{calendarItemText(item)}</span>
                          ) : <button
                            draggable={!readOnly}
                            onDragStart={(event) => {
                              event.dataTransfer.setData("text/calendar-custom-item", item.id);
                            }}
                            type="button"
                          >
                            {calendarItemText(item)}
                          </button>}
                          {!readOnly ? <span className="calendar-builder-special-actions print:hidden">
                            {!isPresetItem(item, "joint_service") && !isPresetItem(item, "communion") ? <>
                              <button
                                disabled={!canMoveCalendarItem(customItems, item, -1)}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  moveCustomItemWithinDate(item.id, -1);
                                }}
                                type="button"
                              >
                                {isEnglish ? "Up" : "上移"}
                              </button>
                              <button
                                disabled={!canMoveCalendarItem(customItems, item, 1)}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  moveCustomItemWithinDate(item.id, 1);
                                }}
                                type="button"
                              >
                                {isEnglish ? "Down" : "下移"}
                              </button>
                            </> : null}
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
                          </span> : null}
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
                    ) : !readOnly ? (
                      <button type="button">
                        {isEnglish ? "Add item" : "新增內容"}
                      </button>
                    ) : null}
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
      <footer className="calendar-builder-footnote">
        <CalendarElderFooter
          elders={elders}
          firstMonth={page.firstMonth}
          lastMonth={page.lastMonth}
        />
        <div className="calendar-builder-joint-legend">
          <div>「 * 」 代表聯合禮拜</div>
          <div>「 * 」 denotes Joint Service</div>
        </div>
      </footer>
      </section>
      ))}
    </div>
  );

  function renderSpecialDateItem(specialDate: CalendarSpecialDate, placedSundayDate: string | null) {
    const placedOnOwnRow = placedSundayDate === ownRowPlacement;
    const previousSunday = specialDate.date ? previousSundayForDate(specialDate.date, annualCalendar.sundays) : null;
    const nextSunday = specialDate.date ? nextSundayForDate(specialDate.date, annualCalendar.sundays) : null;
    const isNonSunday = isNonSundaySpecialDate(specialDate);

    return (
      <div className="calendar-builder-special-item" key={specialDate.key}>
        <span>{formatSpecialDateLabel(specialDate, placedSundayDate, isEnglish)}</span>
        {!readOnly ? <span className="calendar-builder-special-actions print:hidden">
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
        </span> : null}
      </div>
    );
  }
}

function initialPlacements(annualCalendar: AnnualCalendar) {
  return Object.fromEntries(
    annualCalendar.specialDates.map((specialDate) => [specialDate.key, specialDate.sundayDate]),
  );
}

function CalendarThemeDisplay({ isEnglish, theme }: { isEnglish: boolean; theme: CalendarTheme }) {
  const reference = themeReference(theme, false);
  const referenceEn = themeReference(theme, true);

  return (
    <div className="calendar-builder-theme-display">
      <p>
        <strong>{isEnglish ? "Theme:" : "主題："}</strong>{" "}
        {theme.contentZh || (isEnglish ? "Not entered" : "尚未輸入")}
        {reference ? `（${reference}）` : ""}
      </p>
      {theme.contentEn ? (
        <p>
          <strong>Theme:</strong> {theme.contentEn}{referenceEn ? ` (${referenceEn})` : ""}
        </p>
      ) : null}
    </div>
  );
}

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

function CalendarElderFooter({
  elders,
  firstMonth,
  lastMonth,
}: {
  elders: ElderAssignment[];
  firstMonth: number;
  lastMonth: number;
}) {
  if (!elders.some((elder) => elder.name.trim() && elder.months.length)) {
    return null;
  }

  const assignments = monthlyElderAssignments(elders, firstMonth, lastMonth);
  const rows = chunk(assignments, 3);

  return (
    <div className="calendar-builder-elder-grid">
      {rows.map((row, rowIndex) => (
        <div className="calendar-builder-elder-grid-row" key={row[0]?.month || rowIndex}>
          <span className="calendar-builder-elder-grid-label">
            {rowIndex === 0 ? "值星長老：" : rowIndex === 1 ? "Elder in Charge:" : ""}
          </span>
          {row.map(({ month, name }) => (
            <span key={month}>
              {footerMonthShort(month)}{name ? ` (${name})` : ""}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function monthlyElderAssignments(elders: ElderAssignment[], firstMonth: number, lastMonth: number) {
  return Array.from({ length: lastMonth - firstMonth + 1 }, (_, index) => {
    const month = firstMonth + index;
    const name = elders.find((elder) => elder.months.includes(month))?.name.trim() || "";
    return { month, name };
  });
}

function chunk<T>(items: T[], size: number) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  );
}

function footerMonthShort(month: number) {
  return monthShort(month).replace(".", "");
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
    (kind === "joint_service" && item.text === "*") ||
    (kind === "joint_service" && item.text === "「 * 」") ||
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

function canMoveCalendarItem(items: CustomCalendarItem[], item: CustomCalendarItem, direction: -1 | 1) {
  const peers = items.filter(
    (candidate) =>
      candidate.sundayDate === item.sundayDate &&
      calendarItemPriority(candidate) === calendarItemPriority(item),
  );
  const index = peers.findIndex((candidate) => candidate.id === item.id);
  return Boolean(peers[index + direction]);
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

  return `${toChineseMonth(month)}月 (${monthShort(month)})`;
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

function buildPreviewHtml({
  annualCalendar,
  customItemsBySunday,
  displayRows,
  elders,
  isEnglish,
  placements,
  specialDatesBySunday,
  theme,
}: {
  annualCalendar: AnnualCalendar;
  customItemsBySunday: Map<string, CustomCalendarItem[]>;
  displayRows: DisplayRow[];
  elders: ElderAssignment[];
  isEnglish: boolean;
  placements: PlacementState;
  specialDatesBySunday: Map<string, CalendarSpecialDate[]>;
  theme: CalendarTheme;
}) {
  const pageRows = [
    displayRows.filter((row) => row.month <= 6),
    displayRows.filter((row) => row.month >= 7),
  ].map((rowsForPage) =>
    rowsForPage
      .map((row, index) => {
        const previousSundayRow = [...rowsForPage.slice(0, index)]
          .reverse()
          .find((candidate) => candidate.type === "sunday");
        const showMonth = row.type === "sunday" && previousSundayRow?.month !== row.month;
        const isMonthStart = Boolean(previousSundayRow && showMonth);
        const month = showMonth ? monthLabel(row.month, isEnglish) : "";

        if (row.type === "special") {
          const line = `${formatSpecialDateDate(row.specialDate.date, isEnglish)} ${formatSpecialDateLabel(row.specialDate, placements[row.specialDate.key] || null, isEnglish)}`;
          return `<tr class="own-special-row"><td colspan="4">${escapeHtml(line)}</td></tr>`;
        }

        const sortedItems = sortCalendarItems(customItemsBySunday.get(row.sunday.date) || []);
        const hasJointService = sortedItems.some((item) => isPresetItem(item, "joint_service"));
        const customItems = sortedItems
          .filter((item) => !isPresetItem(item, "joint_service"))
          .map(calendarItemText)
          .join("  ");
        const specialItems = (specialDatesBySunday.get(row.sunday.date) || []).map((specialDate) =>
          formatSpecialDateLabel(specialDate, placements[specialDate.key] || null, isEnglish),
        );

        return tableRow([
          month,
          `${formatSundayDay(row.sunday.date, isEnglish)}${hasJointService ? "*" : ""}`,
          customItems,
          specialItems,
        ], isMonthStart ? "month-start" : "");
      })
      .join(""),
  );

  const pages = pageRows
    .map(
      (rows, pageIndex) => `<main class="sheet">
    <header class="title">
      <h1>${annualCalendar.year} ${isEnglish ? "FPCLA Calendar" : "年洛杉磯台灣基督長老教會行事曆"} <span>FPCLA Calendar</span></h1>
      <p><strong>${isEnglish ? "Theme:" : "主題："}</strong> ${escapeHtml(theme.contentZh)}${themeReference(theme, false) ? `（${escapeHtml(themeReference(theme, false))}）` : ""}</p>
      ${theme.contentEn ? `<p><strong>Theme:</strong> ${escapeHtml(theme.contentEn)}${themeReference(theme, true) ? ` (${escapeHtml(themeReference(theme, true))})` : ""}</p>` : ""}
    </header>
    <table>
      <tbody>${rows}</tbody>
    </table>
    <footer class="footnote">
      ${elderFooterHtml(elders, pageIndex === 0 ? 1 : 7, pageIndex === 0 ? 6 : 12)}
      <div class="joint-legend">
        <div>「 * 」 代表聯合禮拜</div>
        <div>「 * 」 denotes Joint Service</div>
      </div>
    </footer>
  </main>`,
    )
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
      display: flex;
      flex-direction: column;
      font-family: "Times New Roman", "PMingLiU", Arial, sans-serif;
      margin: 0 auto 24px;
      max-width: 8.5in;
      min-height: 10in;
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
    }
    th:nth-child(1), td:nth-child(1) { width: 15%; }
    th:nth-child(2), td:nth-child(2) { width: 10%; }
    th:nth-child(3), td:nth-child(3) {
      width: 38%;
    }
    th:nth-child(4), td:nth-child(4) {
      width: 37%;
    }
    th:nth-child(4), td:nth-child(4) {
      text-align: right;
    }
    th:nth-child(1), td:nth-child(1) { font-size: 13px; white-space: nowrap; }
    tbody td:nth-child(1) { padding-left: 2px; text-align: left; }
    tbody td:nth-child(2) { padding-left: 4px; text-align: left; }
    tbody td:nth-child(3) { white-space: pre-wrap; }
    .own-special-row td {
      text-align: center !important;
      white-space: nowrap;
    }
    .month-start td {
      border-top: 3px double #334155;
    }
    .cell-lines {
      display: grid;
      gap: 4px;
    }
    .footnote {
      font-family: Arial, "Noto Sans TC", "Microsoft JhengHei", sans-serif;
      font-size: 12px;
      line-height: 1.5;
      margin-top: auto;
      padding-top: 12px;
      text-align: center;
    }
    .elder-grid {
      display: grid;
      gap: 4px;
      margin-bottom: 30px;
      text-align: left;
    }
    .elder-grid-row {
      display: grid;
      gap: 16px;
      grid-template-columns: 155px repeat(3, minmax(0, 1fr));
    }
    .elder-grid-label {
      white-space: nowrap;
    }
    .joint-legend {
      line-height: 1.6;
      margin-left: 110px;
      text-align: left;
    }
    @media print {
      body { background: white; padding: 0; }
      .actions { display: none; }
      .sheet { border: 0; break-after: page; margin: 0; max-width: none; min-height: 10in; padding: 0.2in; }
      .sheet:last-child { break-after: auto; }
      @page { margin: 0.35in; size: letter portrait; }
    }
  </style>
</head>
<body>
  <div class="actions"><button onclick="window.print()">${isEnglish ? "Print" : "列印"}</button></div>
  ${pages}
</body>
</html>`;
}

function tableRow(cells: Array<string | string[]>, className = "") {
  return `<tr${className ? ` class="${className}"` : ""}>${cells
    .map((cell) => {
      if (Array.isArray(cell)) {
        return `<td><div class="cell-lines">${cell.map((line) => `<div>${escapeHtml(line)}</div>`).join("")}</div></td>`;
      }

      return `<td>${escapeHtml(cell)}</td>`;
    })
    .join("")}</tr>`;
}

function elderFooterHtml(elders: ElderAssignment[], firstMonth: number, lastMonth: number) {
  if (!elders.some((elder) => elder.name.trim() && elder.months.length)) {
    return "";
  }

  const rows = chunk(monthlyElderAssignments(elders, firstMonth, lastMonth), 3);
  return `<div class="elder-grid">${rows.map((row, rowIndex) => `
    <div class="elder-grid-row">
      <span class="elder-grid-label">${rowIndex === 0 ? "值星長老：" : rowIndex === 1 ? "Elder in Charge:" : ""}</span>
      ${row.map(({ month, name }) => `<span>${footerMonthShort(month)}${name ? ` (${escapeHtml(name)})` : ""}</span>`).join("")}
    </div>`).join("")}
  </div>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
