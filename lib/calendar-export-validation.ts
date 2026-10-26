import type { CalendarWordExportPayload } from "./calendar-word-export-types";
export const maximumCalendarExportBytes = 131_072;
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function text(value: unknown, maximum = 4000): value is string {
  return typeof value === "string" && value.length <= maximum;
}
export function isCalendarWordExportPayload(value: unknown): value is CalendarWordExportPayload {
  if (!record(value) || !Number.isInteger(value.year) || Number(value.year) < 2000 || Number(value.year) > 2100 || typeof value.isEnglish !== "boolean" || !text(value.themeChinese) || !text(value.themeEnglish) || !Array.isArray(value.pages) || value.pages.length !== 2) return false;
  return value.pages.every((page: unknown) => {
    if (!record(page) || !Array.isArray(page.elders) || page.elders.length > 16 || !Array.isArray(page.rows) || page.rows.length > 200) return false;
    if (!page.elders.every((elder: unknown) => record(elder) && text(elder.month, 64) && text(elder.name, 200))) return false;
    return page.rows.every((row: unknown) => {
      if (!record(row)) return false;
      if (row.kind === "special") return text(row.text);
      return row.kind === "sunday" && text(row.date, 64) && text(row.month, 64) && typeof row.monthStart === "boolean" && Array.isArray(row.activityLines) && row.activityLines.length <= 40 && row.activityLines.every((line: unknown) => record(line) && text(line.left) && text(line.right));
    });
  });
}
export async function boundedCalendarExportBody(request: Request): Promise<string | null> {
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > maximumCalendarExportBytes)) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  let size = 0; const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maximumCalendarExportBytes) { await reader.cancel(); return null; }
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } finally { reader.releaseLock(); }
}
