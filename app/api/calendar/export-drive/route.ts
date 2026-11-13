import { NextResponse } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { getAnnualCalendar } from "@/lib/annual-calendars-data";
import { hasRecordPermission, resolveEffectivePermissions } from "@/lib/permissions";
import { isDriveAdministrator } from "@/lib/google-drive/admin-access";
import { buildSavedCalendarWordPayload } from "@/lib/calendar-saved-word-payload";
import { packCalendarWordDocument } from "@/lib/calendar-word-export";
import { boundedCalendarExportBody } from "@/lib/calendar-export-validation";
import { CalendarDriveUploadError, confirmSavedCalendarInDrive, getCalendarDriveConfig, prepareCalendarDriveDestination, uploadSavedCalendarToDrive } from "@/lib/google-drive/calendar-upload";
import { DRIVE_ID_PATTERN } from "@/lib/google-drive/policy";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const noStore = {"Cache-Control": "no-store"};
const reply = (status: number, code: string) => NextResponse.json({code}, {status, headers:noStore});

export async function POST(request: Request) {
  if (process.env.CALENDAR_DRIVE_EXPORT_ENABLED !== "true") return reply(503, "not_enabled");
  const {user, profile} = await getCurrentUserAndProfile();
  if (!user) return reply(401, "sign_in_required");
  if (!profile?.active || !profile.approved || !(await isDriveAdministrator(user.id))) return reply(403, "forbidden");
  if (request.headers.get("origin") !== new URL(request.url).origin ||
      request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return reply(403, "forbidden");
  let data: unknown;
  try { const text = await boundedCalendarExportBody(request); if (text === null || text.length > 1024) return reply(413, "invalid_request"); data = JSON.parse(text); }
  catch { return reply(400, "invalid_request"); }
  if (!data || typeof data !== "object" || Array.isArray(data) || Object.keys(data).sort().join(",") !== "requestId,version,year") return reply(400, "invalid_request");
  const {year, version, requestId} = data as {year: unknown; version: unknown; requestId: unknown};
  if (!Number.isInteger(year) || Number(year) < 2000 || Number(year) > 2100 || !Number.isSafeInteger(version) || Number(version) < 1)
    return reply(400, "invalid_request");
  if (typeof requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(requestId)) return reply(400, "invalid_request");
  let config;
  try { config = getCalendarDriveConfig(); } catch { return reply(503, "not_configured"); }
  const admin = getSupabaseAdminClient();
  let calendar;
  try { calendar = await getAnnualCalendar(Number(year)); } catch { return reply(503, "calendar_unavailable"); }
  if (!calendar) return reply(404, "not_found");
  const permissions = await resolveEffectivePermissions(user.id, "calendar_events");
  if (!permissions.export || !(await hasRecordPermission(user.id, "calendar_events", calendar.id, "preview"))) return reply(403, "forbidden");
  if (calendar.version !== version) return reply(409, "calendar_changed");
  let document: Buffer;
  try { document = await packCalendarWordDocument(buildSavedCalendarWordPayload(calendar, profile.language_preference === "en")); }
  catch { return reply(500, "document_failed"); }

  // Google authorization and the exact configured folder are checked before reserving a write.
  let destination;
  try { destination = await prepareCalendarDriveDestination(config); }
  catch { return reply(503, "drive_unavailable"); }

  const id = requestId;
  let reserveError;
  try {
    ({error: reserveError} = await admin.from("calendar_drive_exports").insert({id, calendar_id:calendar.id,
      calendar_version:calendar.version, calendar_year:calendar.calendarYear, requested_by:user.id, status:"pending"}));
  } catch {
    // No Google write is attempted if the reservation response is unavailable.
    return reply(503, "receipt_unavailable");
  }
  if (reserveError) {
    if (reserveError.code !== "23505") return reply(503, "receipt_unavailable");
    // A retry with the same request can recover a successful response without
    // writing a second Drive file. Never expose another user's receipt.
    try {
      const {data: previous, error} = await admin.from("calendar_drive_exports")
        .select("requested_by,calendar_id,calendar_year,calendar_version,status,drive_file_id")
        .eq("id", id).maybeSingle();
      if (error) return reply(503, "receipt_unavailable");
      if (previous && previous.requested_by === user.id && previous.calendar_id === calendar.id &&
          previous.calendar_year === calendar.calendarYear && previous.calendar_version === calendar.version &&
          (previous.status === "saved" || previous.status === "needs_review") &&
          typeof previous.drive_file_id === "string" &&
          DRIVE_ID_PATTERN.test(previous.drive_file_id)) {
        try {
          const checksumVerified = await confirmSavedCalendarInDrive(destination, previous.drive_file_id, id.replaceAll("-", ""));
          if (previous.status === "saved") return reply(200, "saved");
          if (!checksumVerified) return reply(503, "needs_review");
          const {data: updated, error: updateError} = await admin.from("calendar_drive_exports")
            .update({status:"saved", updated_at:new Date().toISOString()})
            .eq("id", id).eq("status", "needs_review").eq("drive_file_id", previous.drive_file_id)
            .eq("requested_by", user.id).eq("calendar_id", calendar.id)
            .eq("calendar_year", calendar.calendarYear).eq("calendar_version", calendar.version)
            .select("id").maybeSingle();
          return !updateError && updated ? reply(200, "saved") : reply(503, "needs_review");
        } catch { return reply(503, "needs_review"); }
      }
    } catch {
      return reply(503, "receipt_unavailable");
    }
    return reply(409, "export_unresolved");
  }

  // If another user saved a new version during preparation, do not upload the older one.
  let current;
  try { current = await getAnnualCalendar(Number(year)); } catch { current = null; }
  if (!current || current.id !== calendar.id || current.version !== calendar.version) {
    try {
      const {data, error} = await admin.from("calendar_drive_exports").update({status:"failed", updated_at:new Date().toISOString()})
        .eq("id", id).eq("status", "pending").select("id").maybeSingle();
      return !error && data ? reply(409, "calendar_changed") : reply(503, "needs_review");
    } catch {
      return reply(503, "needs_review");
    }
  }
  let driveFileId: string | undefined;
  try {
    driveFileId = await uploadSavedCalendarToDrive(destination, {requestId:id.replaceAll("-", ""),
      version:calendar.version, year:calendar.calendarYear, document});
    const {data, error} = await admin.from("calendar_drive_exports").update({status:"saved", drive_file_id:driveFileId, updated_at:new Date().toISOString()})
      .eq("id", id).eq("status", "pending").select("id").maybeSingle();
    if (error || !data) throw new Error("Unable to record confirmed export");
    return reply(200, "saved");
  } catch (error) {
    // Any uncertainty after reserving remains blocked against another write.
    try {
      const fileId = driveFileId ?? (error instanceof CalendarDriveUploadError ? error.fileId : undefined);
      await admin.from("calendar_drive_exports").update({
        status:"needs_review", updated_at:new Date().toISOString(),
        ...(fileId ? {drive_file_id:fileId} : {}),
      })
        .eq("id", id).eq("status", "pending");
    } catch {
      // The pending reservation remains the guard if the status cannot be recorded.
    }
    return reply(503, "needs_review");
  }
}
