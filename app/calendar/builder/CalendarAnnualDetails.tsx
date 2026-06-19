"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { bibleBooks, calendarMonths } from "./calendar-options";

export type CalendarTheme = {
  bookId: string;
  chapter: string;
  contentEn: string;
  contentZh: string;
  verse: string;
};

export type ElderAssignment = {
  id: string;
  months: number[];
  name: string;
};

type Props = {
  elders: ElderAssignment[];
  isEnglish: boolean;
  setElders: Dispatch<SetStateAction<ElderAssignment[]>>;
  setTheme: Dispatch<SetStateAction<CalendarTheme>>;
  theme: CalendarTheme;
};

export function CalendarAnnualDetails({ elders, isEnglish, setElders, setTheme, theme }: Props) {
  const [translationStatus, setTranslationStatus] = useState("");

  async function translateTheme() {
    const text = theme.contentZh.trim();
    if (!text) {
      setTranslationStatus(isEnglish ? "Enter the Chinese theme first." : "請先輸入中文主題");
      return;
    }

    setTranslationStatus(isEnglish ? "Translating..." : "翻譯中...");
    try {
      const query = new URLSearchParams({ langpair: "zh-TW|en-US", q: text });
      const response = await fetch(`https://api.mymemory.translated.net/get?${query}`);
      if (!response.ok) {
        throw new Error("translation failed");
      }
      const result = (await response.json()) as { responseData?: { translatedText?: string } };
      const translatedText = result.responseData?.translatedText?.trim();
      if (!translatedText) {
        throw new Error("translation missing");
      }
      setTheme((current) => ({ ...current, contentEn: translatedText }));
      setTranslationStatus(isEnglish ? "Translated" : "已翻譯成英文");
    } catch {
      setTranslationStatus(isEnglish ? "Enter or revise the English translation." : "無法自動翻譯，請直接輸入英文內容");
    }
  }

  const assignedMonths = useMemo(() => new Set(elders.flatMap((elder) => elder.months)), [elders]);
  const unassignedMonths = calendarMonths.filter(([month]) => !assignedMonths.has(month));

  function updateElder(id: string, update: Partial<ElderAssignment>) {
    setElders((current) => current.map((elder) => elder.id === id ? { ...elder, ...update } : elder));
  }

  function toggleMonth(elder: ElderAssignment, month: number) {
    const months = elder.months.includes(month)
      ? elder.months.filter((selectedMonth) => selectedMonth !== month)
      : [...elder.months, month].sort((left, right) => left - right);
    updateElder(elder.id, { months });
  }

  return (
    <div className="calendar-builder-annual-details print:hidden">
      <section className="calendar-builder-detail-section">
        <h3>{isEnglish ? "Annual theme" : "年度主題"}</h3>
        <div className="calendar-builder-theme-grid">
          <label>
            <span>{isEnglish ? "Chinese content" : "中文內容"}</span>
            <input
              maxLength={180}
              onChange={(event) => setTheme((current) => ({ ...current, contentZh: event.target.value }))}
              value={theme.contentZh}
            />
          </label>
          <label>
            <span>{isEnglish ? "Bible book" : "聖經經卷"}</span>
            <select
              onChange={(event) => setTheme((current) => ({ ...current, bookId: event.target.value }))}
              value={theme.bookId}
            >
              <option value="">{isEnglish ? "Select" : "請選擇"}</option>
              {bibleBooks.map(([id, zh, en]) => <option key={id} value={id}>{zh} / {en}</option>)}
            </select>
          </label>
          <label>
            <span>{isEnglish ? "Chapter" : "章"}</span>
            <input min="1" onChange={(event) => setTheme((current) => ({ ...current, chapter: event.target.value }))} type="number" value={theme.chapter} />
          </label>
          <label>
            <span>{isEnglish ? "Verse" : "節"}</span>
            <input min="1" onChange={(event) => setTheme((current) => ({ ...current, verse: event.target.value }))} type="number" value={theme.verse} />
          </label>
        </div>
        <label className="calendar-builder-theme-english">
          <span className="calendar-builder-translation-label">
            {isEnglish ? "English translation" : "英文翻譯"}
            <button onClick={translateTheme} type="button">
              {isEnglish ? "Translate" : "翻譯成英文"}
            </button>
          </span>
          <input
            maxLength={220}
            onChange={(event) => setTheme((current) => ({ ...current, contentEn: event.target.value }))}
            value={theme.contentEn}
          />
          <small>{translationStatus}</small>
        </label>
      </section>

      <section className="calendar-builder-detail-section">
        <div className="calendar-builder-detail-heading">
          <h3>{isEnglish ? "Elder in charge assignments" : "值星長老指派"}</h3>
          <button
            onClick={() => setElders((current) => [...current, { id: `elder-${Date.now()}`, months: [], name: "" }])}
            type="button"
          >
            {isEnglish ? "Add elder" : "新增長老"}
          </button>
        </div>
        <div className="calendar-builder-elder-layout">
          <div className="calendar-builder-elder-list">
            {elders.map((elder, index) => (
              <div className="calendar-builder-elder-row" key={elder.id}>
                <label>
                  <span>{isEnglish ? `Elder ${index + 1}` : `長老 ${index + 1}`}</span>
                  <input onChange={(event) => updateElder(elder.id, { name: event.target.value })} value={elder.name} />
                </label>
                <details className="calendar-builder-month-menu">
                  <summary>
                    {elder.months.length
                      ? calendarMonths.filter(([month]) => elder.months.includes(month)).map(([, zh, en]) => isEnglish ? en : `${zh} (${en})`).join("、")
                      : isEnglish ? "Select months" : "選擇月份"}
                  </summary>
                  <div>
                    {calendarMonths.map(([month, zh, en]) => {
                      const selectedByOther = elders.some((candidate) => candidate.id !== elder.id && candidate.months.includes(month));
                      return (
                        <label key={month}>
                          <input
                            checked={elder.months.includes(month)}
                            disabled={selectedByOther}
                            onChange={() => toggleMonth(elder, month)}
                            type="checkbox"
                          />
                          <span>{isEnglish ? en : `${zh} (${en})`}</span>
                        </label>
                      );
                    })}
                  </div>
                </details>
                <button className="calendar-builder-remove-elder" onClick={() => setElders((current) => current.filter((item) => item.id !== elder.id))} type="button">
                  {isEnglish ? "Remove" : "移除"}
                </button>
              </div>
            ))}
          </div>
          <aside className="calendar-builder-unassigned-months">
            <strong>{isEnglish ? "Unassigned months" : "尚未安排月份"}</strong>
            <p>{unassignedMonths.length ? unassignedMonths.map(([, zh, en]) => isEnglish ? en : `${zh} (${en})`).join("、") : isEnglish ? "All assigned" : "已全部安排"}</p>
          </aside>
        </div>
      </section>
    </div>
  );
}
