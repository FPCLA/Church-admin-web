export const annualCalendarFellowships = [
  "小會",
  "執事會",
  "長青團契",
  "婦女團契",
  "英語部",
  "聖歌隊",
  "手鐘團",
  "主日學",
] as const;

export type AnnualCalendarFellowship = (typeof annualCalendarFellowships)[number];
export type AnnualCalendarPresetKind = "joint_service" | "communion";
export type AnnualCalendarPlacement = string | null;

export type AnnualCalendarCustomItem = {
  align?: "right";
  fellowship?: AnnualCalendarFellowship;
  id: string;
  kind?: AnnualCalendarPresetKind | "custom";
  newLine?: boolean;
  sundayDate: string;
  text: string;
};

export type AnnualCalendarTheme = {
  bookId: string;
  chapter: string;
  contentEn: string;
  contentZh: string;
  verse: string;
};

export type AnnualCalendarElderAssignment = {
  id: string;
  months: number[];
  name: string;
};

export type AnnualCalendarDetails = {
  elders: AnnualCalendarElderAssignment[];
  theme: AnnualCalendarTheme;
};

export type AnnualCalendarContent = {
  annualDetails: AnnualCalendarDetails;
  customItems: AnnualCalendarCustomItem[];
  placements: Record<string, AnnualCalendarPlacement>;
  specialAlignments: Record<string, boolean>;
};

export type AnnualCalendarRecord = AnnualCalendarContent & {
  calendarYear: number;
  createdAt: string;
  id: string;
  updatedAt: string;
  version: number;
};

export type AnnualCalendarSavePayload = AnnualCalendarContent & {
  calendarYear: number;
  expectedVersion: number | null;
};

export type AnnualCalendarSaveErrorCode =
  | "audit-failed"
  | "conflict"
  | "invalid-data"
  | "save-failed"
  | "verification-failed";

export type AnnualCalendarSaveResult =
  | { ok: true; record: AnnualCalendarRecord }
  | {
      code: AnnualCalendarSaveErrorCode;
      ok: false;
      record?: AnnualCalendarRecord;
    };

const ownRowPlacement = "__own_row__";
const allowedKinds = new Set<AnnualCalendarCustomItem["kind"]>([
  undefined,
  "custom",
  "joint_service",
  "communion",
]);
const fellowshipSet = new Set<string>(annualCalendarFellowships);
const emptyTheme: AnnualCalendarTheme = {
  bookId: "",
  chapter: "",
  contentEn: "",
  contentZh: "",
  verse: "",
};

export function parseAnnualCalendarSavePayload(input: unknown): AnnualCalendarSavePayload | null {
  if (!isPlainRecord(input)) {
    return null;
  }

  const calendarYear = Number(input.calendarYear);
  const expectedVersion = input.expectedVersion;
  if (
    !Number.isInteger(calendarYear) ||
    calendarYear < 2000 ||
    calendarYear > 2100 ||
    !(
      expectedVersion === null ||
      (Number.isInteger(expectedVersion) && Number(expectedVersion) >= 1)
    )
  ) {
    return null;
  }

  const content = parseAnnualCalendarContent(input, calendarYear);
  if (!content) {
    return null;
  }

  const payload = {
    ...content,
    calendarYear,
    expectedVersion: expectedVersion === null ? null : Number(expectedVersion),
  };

  return JSON.stringify(payload).length <= 500_000 ? payload : null;
}

export function normalizeAnnualCalendarRecord(row: Record<string, unknown>): AnnualCalendarRecord {
  const calendarYear = Number(row.calendar_year);
  const content = parseAnnualCalendarContent(
    {
      annualDetails: row.annual_details,
      customItems: row.custom_items,
      placements: row.placements,
      specialAlignments: row.special_alignments,
    },
    calendarYear,
  );

  const version = Number(row.version);
  if (
    !content ||
    !Number.isInteger(calendarYear) ||
    calendarYear < 2000 ||
    calendarYear > 2100 ||
    !Number.isInteger(version) ||
    version < 1 ||
    typeof row.id !== "string"
  ) {
    throw new Error("Invalid annual calendar record.");
  }

  return {
    ...content,
    calendarYear,
    createdAt: stringValue(row.created_at, 100),
    id: row.id,
    updatedAt: stringValue(row.updated_at, 100),
    version,
  };
}

export function annualCalendarContentEquals(
  left: AnnualCalendarContent,
  right: AnnualCalendarContent,
) {
  return stableStringify(left) === stableStringify(right);
}

export function annualCalendarContentFromRecord(record: AnnualCalendarRecord): AnnualCalendarContent {
  return {
    annualDetails: record.annualDetails,
    customItems: record.customItems,
    placements: record.placements,
    specialAlignments: record.specialAlignments,
  };
}

export function annualCalendarDraftFingerprint(content: AnnualCalendarContent) {
  return stableStringify(content);
}

function parseAnnualCalendarContent(
  input: Record<string, unknown>,
  calendarYear: number,
): AnnualCalendarContent | null {
  const customItems = parseCustomItems(input.customItems, calendarYear);
  const placements = parsePlacements(input.placements, calendarYear);
  const specialAlignments = parseSpecialAlignments(input.specialAlignments);
  const annualDetails = parseAnnualDetails(input.annualDetails);

  if (!customItems || !placements || !specialAlignments || !annualDetails) {
    return null;
  }

  return { annualDetails, customItems, placements, specialAlignments };
}

function parseCustomItems(value: unknown, calendarYear: number) {
  if (!Array.isArray(value) || value.length > 500) {
    return null;
  }

  const ids = new Set<string>();
  const items: AnnualCalendarCustomItem[] = [];
  for (const candidate of value) {
    if (!isPlainRecord(candidate)) {
      return null;
    }

    const id = optionalString(candidate.id, 160);
    const text = optionalString(candidate.text, 500, true);
    const sundayDate = optionalString(candidate.sundayDate, 10);
    if (
      !id ||
      ids.has(id) ||
      text === null ||
      !sundayDate ||
      !isSundayInYear(sundayDate, calendarYear) ||
      !allowedKinds.has(candidate.kind as AnnualCalendarCustomItem["kind"])
    ) {
      return null;
    }

    const fellowship = candidate.fellowship;
    if (fellowship !== undefined && !fellowshipSet.has(String(fellowship))) {
      return null;
    }
    if (!text && !fellowship) {
      return null;
    }
    if (candidate.align !== undefined && candidate.align !== "right") {
      return null;
    }
    if (candidate.newLine !== undefined && typeof candidate.newLine !== "boolean") {
      return null;
    }

    ids.add(id);
    items.push({
      ...(candidate.align === "right" ? { align: "right" as const } : {}),
      ...(fellowship ? { fellowship: fellowship as AnnualCalendarFellowship } : {}),
      id,
      ...(candidate.kind ? { kind: candidate.kind as AnnualCalendarCustomItem["kind"] } : {}),
      ...(candidate.newLine === true ? { newLine: true } : {}),
      sundayDate,
      text,
    });
  }

  return items;
}

function parsePlacements(value: unknown, calendarYear: number) {
  if (!isPlainRecord(value) || Object.keys(value).length > 200) {
    return null;
  }

  const placements: Record<string, AnnualCalendarPlacement> = {};
  for (const [key, placement] of Object.entries(value)) {
    if (!key || key.length > 160) {
      return null;
    }
    if (
      placement !== null &&
      placement !== ownRowPlacement &&
      !(typeof placement === "string" && isSundayInYear(placement, calendarYear))
    ) {
      return null;
    }
    placements[key] = placement as AnnualCalendarPlacement;
  }

  return placements;
}

function parseSpecialAlignments(value: unknown) {
  if (!isPlainRecord(value) || Object.keys(value).length > 200) {
    return null;
  }

  const alignments: Record<string, boolean> = {};
  for (const [key, alignment] of Object.entries(value)) {
    if (!key || key.length > 160 || typeof alignment !== "boolean") {
      return null;
    }
    alignments[key] = alignment;
  }

  return alignments;
}

function parseAnnualDetails(value: unknown): AnnualCalendarDetails | null {
  if (!isPlainRecord(value) || !Array.isArray(value.elders) || value.elders.length > 50) {
    return null;
  }

  const ids = new Set<string>();
  const assignedMonths = new Set<number>();
  const elders: AnnualCalendarElderAssignment[] = [];
  for (const candidate of value.elders) {
    if (!isPlainRecord(candidate) || !Array.isArray(candidate.months)) {
      return null;
    }

    const id = optionalString(candidate.id, 160);
    const name = optionalString(candidate.name, 200, true);
    const months = candidate.months.map(Number);
    if (
      !id ||
      ids.has(id) ||
      name === null ||
      months.length > 12 ||
      months.some((month) => !Number.isInteger(month) || month < 1 || month > 12) ||
      new Set(months).size !== months.length ||
      months.some((month) => assignedMonths.has(month))
    ) {
      return null;
    }

    ids.add(id);
    months.forEach((month) => assignedMonths.add(month));
    elders.push({ id, months: [...months].sort((left, right) => left - right), name });
  }

  const themeValue = value.theme;
  if (!isPlainRecord(themeValue)) {
    return null;
  }

  const theme: AnnualCalendarTheme = {
    bookId: optionalString(themeValue.bookId, 80, true) ?? emptyTheme.bookId,
    chapter: optionalString(themeValue.chapter, 12, true) ?? emptyTheme.chapter,
    contentEn: optionalString(themeValue.contentEn, 220, true) ?? emptyTheme.contentEn,
    contentZh: optionalString(themeValue.contentZh, 180, true) ?? emptyTheme.contentZh,
    verse: optionalString(themeValue.verse, 12, true) ?? emptyTheme.verse,
  };

  return { elders, theme };
}

function isSundayInYear(value: string, calendarYear: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value &&
    date.getUTCFullYear() === calendarYear &&
    date.getUTCDay() === 0
  );
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function optionalString(value: unknown, maxLength: number, allowEmpty = false) {
  if (typeof value !== "string" || value.length > maxLength) {
    return null;
  }
  return value || allowEmpty ? value : null;
}

function stringValue(value: unknown, maxLength: number) {
  return typeof value === "string" && value.length <= maxLength ? value : "";
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (isPlainRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

