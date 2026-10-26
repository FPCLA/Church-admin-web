import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeightRule,
  LineRuleType,
  Packer,
  PageOrientation,
  Paragraph,
  SectionType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import type {
  CalendarWordElderAssignment,
  CalendarWordExportPayload,
  CalendarWordPage,
  CalendarWordRow,
} from "./calendar-word-export-types";

const letterWidth = 12_240;
const letterHeight = 15_840;
const horizontalPageMargin = 720;
const standardTopMargin = 360;
const compactTopMargin = 240;
const bottomPageMargin = 1_560;
const footerDistance = 120;
const contentWidth = letterWidth - horizontalPageMargin * 2;
const monthWidth = 960;
const dateWidth = 720;
const dateMarkerWidth = 180;
const leftContentWidth = 5_220;
const rightContentWidth = contentWidth - monthWidth - dateWidth - dateMarkerWidth - leftContentWidth;
const elderLabelWidth = 2_520;
const elderAssignmentWidth = (contentWidth - elderLabelWidth) / 3;
const bodyColor = "002060";
const chineseFont = "新細明體";
const englishFont = "Times New Roman";
const bodySize = 24;
const titleSize = 28;
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } as const;
const singleBorder = { style: BorderStyle.SINGLE, size: 6, color: "000000" } as const;
const doubleBorder = { style: BorderStyle.DOUBLE, size: 6, color: "000000" } as const;

function run(text: string, size = bodySize, bold = false) {
  return new TextRun({
    bold,
    color: bodyColor,
    font: {
      ascii: englishFont,
      cs: englishFont,
      eastAsia: chineseFont,
      hAnsi: englishFont,
    },
    language: { bidirectional: "ar-SA", eastAsia: "zh-TW", value: "en-US" },
    size,
    sizeComplexScript: size,
    text,
  });
}

function paragraph(
  text = "",
  options: {
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    bold?: boolean;
    keepNext?: boolean;
    size?: number;
  } = {},
) {
  return new Paragraph({
    alignment: options.alignment,
    children: text ? [run(text, options.size, options.bold)] : [],
    keepLines: true,
    keepNext: options.keepNext,
    spacing: { after: 0, before: 0, line: 240, lineRule: LineRuleType.AUTO },
    widowControl: false,
  });
}

function cell(
  text: string,
  width: number,
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType],
  borders: { top?: typeof doubleBorder; bottom?: typeof singleBorder | typeof noBorder } = {},
) {
  return new TableCell({
    borders: {
      bottom: borders.bottom || singleBorder,
      left: noBorder,
      right: noBorder,
      top: borders.top || noBorder,
    },
    children: [paragraph(text, { alignment })],
    margins: { bottom: 0, left: 30, right: 30, top: 0 },
    verticalAlign: VerticalAlign.CENTER,
    width: { size: width, type: WidthType.DXA },
  });
}

function activityLines(row: Extract<CalendarWordRow, { kind: "sunday" }>) {
  return row.activityLines.length ? row.activityLines : [{ left: "", right: "" }];
}

function splitDateAndMarker(date: string) {
  return date.endsWith("*") ? { date: date.slice(0, -1), marker: "*" } : { date, marker: "" };
}

function sundayRows(row: Extract<CalendarWordRow, { kind: "sunday" }>, rowHeight: number) {
  const lines = activityLines(row);
  const dateParts = splitDateAndMarker(row.date);
  return lines.map(
    (line, lineIndex) => {
      const bottomBorder = lineIndex === lines.length - 1 ? singleBorder : noBorder;

      return new TableRow({
        cantSplit: true,
        children: [
          cell(lineIndex === 0 ? row.month : "", monthWidth, AlignmentType.LEFT, {
            bottom: bottomBorder,
            top: row.monthStart && lineIndex === 0 ? doubleBorder : undefined,
          }),
          cell(lineIndex === 0 ? dateParts.date : "", dateWidth, AlignmentType.RIGHT, {
            bottom: bottomBorder,
            top: row.monthStart && lineIndex === 0 ? doubleBorder : undefined,
          }),
          cell(lineIndex === 0 ? dateParts.marker : "", dateMarkerWidth, AlignmentType.LEFT, {
            bottom: bottomBorder,
            top: row.monthStart && lineIndex === 0 ? doubleBorder : undefined,
          }),
          cell(line.left, leftContentWidth, AlignmentType.LEFT, {
            bottom: bottomBorder,
            top: row.monthStart && lineIndex === 0 ? doubleBorder : undefined,
          }),
          cell(line.right, rightContentWidth, AlignmentType.LEFT, {
            bottom: bottomBorder,
            top: row.monthStart && lineIndex === 0 ? doubleBorder : undefined,
          }),
        ],
        height: { rule: HeightRule.ATLEAST, value: rowHeight },
      });
    },
  );
}

function specialRow(row: Extract<CalendarWordRow, { kind: "special" }>, rowHeight: number) {
  return new TableRow({
    cantSplit: true,
    children: [
      new TableCell({
        borders: { bottom: singleBorder, left: noBorder, right: noBorder, top: noBorder },
        children: [paragraph(row.text, { alignment: AlignmentType.CENTER })],
        columnSpan: 5,
        margins: { bottom: 0, left: 30, right: 30, top: 0 },
        verticalAlign: VerticalAlign.CENTER,
        width: { size: contentWidth, type: WidthType.DXA },
      }),
    ],
    height: { rule: HeightRule.ATLEAST, value: rowHeight },
  });
}

function calendarTable(rows: CalendarWordRow[]) {
  const rowHeight = calendarRowHeight(rows);
  const tableRows = rows.flatMap((row) =>
    row.kind === "special" ? [specialRow(row, rowHeight)] : sundayRows(row, rowHeight),
  );
  return new Table({
    borders: {
      bottom: noBorder,
      insideHorizontal: noBorder,
      insideVertical: noBorder,
      left: noBorder,
      right: noBorder,
      top: noBorder,
    },
    columnWidths: [monthWidth, dateWidth, dateMarkerWidth, leftContentWidth, rightContentWidth],
    layout: TableLayoutType.FIXED,
    margins: { bottom: 0, left: 0, right: 0, top: 0 },
    rows: tableRows,
    width: { size: contentWidth, type: WidthType.DXA },
  });
}

function expandedCalendarRowCount(rows: CalendarWordRow[]) {
  return rows.reduce(
    (count, row) => count + (row.kind === "special" ? 1 : Math.max(1, row.activityLines.length)),
    0,
  );
}

function calendarRowHeight(rows: CalendarWordRow[]) {
  const rowCount = expandedCalendarRowCount(rows);
  if (rowCount > 34) {
    return 240;
  }

  if (rowCount > 30) {
    return 270;
  }

  return 300;
}

function elderCell(text: string, width: number) {
  return new TableCell({
    borders: { bottom: noBorder, left: noBorder, right: noBorder, top: noBorder },
    children: [paragraph(text, { alignment: AlignmentType.LEFT })],
    margins: { bottom: 0, left: 0, right: 0, top: 0 },
    verticalAlign: VerticalAlign.CENTER,
    width: { size: width, type: WidthType.DXA },
  });
}

function elderAssignmentText(assignment: CalendarWordElderAssignment | undefined) {
  if (!assignment) {
    return "";
  }

  return `${assignment.month}${assignment.name ? ` (${assignment.name})` : ""}`;
}

function elderTable(page: CalendarWordPage, isEnglish: boolean) {
  const elderRows = [page.elders.slice(0, 3), page.elders.slice(3, 6)];
  const labels = [isEnglish ? "Elder in Charge:" : "值星長老：", "Elder in Charge:"];
  return new Table({
    borders: {
      bottom: noBorder,
      insideHorizontal: noBorder,
      insideVertical: noBorder,
      left: noBorder,
      right: noBorder,
      top: noBorder,
    },
    columnWidths: [elderLabelWidth, elderAssignmentWidth, elderAssignmentWidth, elderAssignmentWidth],
    layout: TableLayoutType.FIXED,
    margins: { bottom: 0, left: 0, right: 0, top: 0 },
    rows: elderRows.map(
      (assignments, rowIndex) =>
        new TableRow({
          cantSplit: true,
          children: [
            elderCell(labels[rowIndex], elderLabelWidth),
            ...Array.from({ length: 3 }, (_, columnIndex) =>
              elderCell(elderAssignmentText(assignments[columnIndex]), elderAssignmentWidth),
            ),
          ],
        }),
    ),
    width: { size: contentWidth, type: WidthType.DXA },
  });
}

function pageFooter(page: CalendarWordPage, isEnglish: boolean) {
  return new Footer({
    children: [
      elderTable(page, isEnglish),
      paragraph(""),
      paragraph("「 * 」  代表聯合禮拜", { keepNext: true }),
      paragraph("「 * 」  denotes Joint Service"),
    ],
  });
}

function heading(payload: CalendarWordExportPayload) {
  const title = payload.isEnglish
    ? `${payload.year} FPCLA Calendar`
    : `${payload.year} 年洛杉磯台灣基督長老教會行事曆   FPCLA Calendar`;
  return [
    paragraph("", { keepNext: true }),
    paragraph(title, { alignment: AlignmentType.CENTER, keepNext: true, size: titleSize }),
    paragraph("", { keepNext: true }),
    paragraph(payload.themeChinese, { alignment: AlignmentType.CENTER, keepNext: true, size: titleSize }),
    ...(payload.themeEnglish
      ? [paragraph(payload.themeEnglish, { alignment: AlignmentType.CENTER, keepNext: true, size: titleSize })]
      : []),
    new Paragraph({
      border: { bottom: { style: BorderStyle.DASHED, size: 10, color: "000000", space: 1 } },
      children: [],
      keepNext: true,
      spacing: { after: 80, before: 0, line: 240 },
    }),
  ];
}

function pageProperties(rows: CalendarWordRow[], nextPage = false) {
  return {
    grid: { linePitch: 360 },
    page: {
      margin: {
        bottom: bottomPageMargin,
        footer: footerDistance,
        gutter: 0,
        header: expandedCalendarRowCount(rows) > 34 ? compactTopMargin : standardTopMargin,
        left: horizontalPageMargin,
        right: horizontalPageMargin,
        top: expandedCalendarRowCount(rows) > 34 ? compactTopMargin : standardTopMargin,
      },
      size: {
        height: letterHeight,
        orientation: PageOrientation.PORTRAIT,
        width: letterWidth,
      },
    },
    type: nextPage ? SectionType.NEXT_PAGE : undefined,
  };
}

export function createCalendarWordDocument(payload: CalendarWordExportPayload) {
  const firstPage = payload.pages[0];
  const secondPage = payload.pages[1];
  return new Document({
    compatabilityModeVersion: 15,
    creator: "FPCLA Church Admin",
    defaultTabStop: 720,
    description: "FPCLA annual calendar",
    lastModifiedBy: "FPCLA Church Admin",
    sections: [
      {
        children: [...heading(payload), calendarTable(firstPage.rows)],
        footers: { default: pageFooter(firstPage, payload.isEnglish) },
        properties: pageProperties(firstPage.rows),
      },
      {
        children: [...heading(payload), calendarTable(secondPage.rows)],
        footers: { default: pageFooter(secondPage, payload.isEnglish) },
        properties: pageProperties(secondPage.rows, true),
      },
    ],
    styles: {
      default: {
        document: {
          paragraph: { spacing: { after: 0, before: 0, line: 240, lineRule: LineRuleType.AUTO } },
          run: {
            color: bodyColor,
            font: {
              ascii: englishFont,
              cs: englishFont,
              eastAsia: chineseFont,
              hAnsi: englishFont,
            },
            language: { bidirectional: "ar-SA", eastAsia: "zh-TW", value: "en-US" },
            size: bodySize,
            sizeComplexScript: bodySize,
          },
        },
      },
    },
    subject: `${payload.year} FPCLA Calendar`,
    title: `${payload.year} FPCLA Calendar`,
  });
}

export function packCalendarWordDocument(payload: CalendarWordExportPayload) {
  return Packer.toBuffer(createCalendarWordDocument(payload));
}

