"use server";

import { revalidatePath } from "next/cache";
import { requireApprovedProfile } from "@/lib/auth";
import {
  annualCalendarContentEquals,
  annualCalendarContentFromRecord,
  normalizeAnnualCalendarRecord,
  parseAnnualCalendarSavePayload,
  type AnnualCalendarSaveResult,
} from "@/lib/annual-calendars";
import { requirePermission, requireRecordPermission } from "@/lib/permissions";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function saveAnnualCalendar(input: unknown): Promise<AnnualCalendarSaveResult> {
  const payload = parseAnnualCalendarSavePayload(input);
  if (!payload) {
    return { code: "invalid-data", ok: false };
  }

  const { user } = await requireApprovedProfile();
  await requirePermission(user.id, "calendar_events", "preview");
  const admin = getSupabaseAdminClient();
  const { data: existingRow, error: existingError } = await admin
    .from("annual_calendars")
    .select("*")
    .eq("calendar_year", payload.calendarYear)
    .maybeSingle<Record<string, unknown>>();

  if (existingError) {
    return { code: "save-failed", ok: false };
  }

  const existing = existingRow ? normalizeAnnualCalendarRecord(existingRow) : null;
  if (existing) {
    await requireRecordPermission(user.id, "calendar_events", existing.id, "edit");
  } else {
    await requirePermission(user.id, "calendar_events", "create");
  }

  if (
    (existing && payload.expectedVersion !== existing.version) ||
    (!existing && payload.expectedVersion !== null)
  ) {
    return { code: "conflict", ok: false };
  }

  const row = {
    annual_details: payload.annualDetails,
    calendar_year: payload.calendarYear,
    custom_items: payload.customItems,
    placements: payload.placements,
    special_alignments: payload.specialAlignments,
    updated_by: user.id,
  };

  let savedRow: Record<string, unknown> | null = null;
  let saveErrorCode = "";
  if (existing) {
    const { data, error } = await admin
      .from("annual_calendars")
      .update(row)
      .eq("id", existing.id)
      .eq("version", existing.version)
      .select("*")
      .maybeSingle<Record<string, unknown>>();
    savedRow = data;
    saveErrorCode = error?.code || "";
  } else {
    const { data, error } = await admin
      .from("annual_calendars")
      .insert({ ...row, created_by: user.id })
      .select("*")
      .maybeSingle<Record<string, unknown>>();
    savedRow = data;
    saveErrorCode = error?.code || "";
  }

  if (!savedRow) {
    return {
      code: saveErrorCode === "23505" ? "conflict" : "save-failed",
      ok: false,
    };
  }

  const saved = normalizeAnnualCalendarRecord(savedRow);
  const { data: verifiedRow, error: verificationError } = await admin
    .from("annual_calendars")
    .select("*")
    .eq("calendar_year", payload.calendarYear)
    .maybeSingle<Record<string, unknown>>();

  if (verificationError || !verifiedRow) {
    return { code: "verification-failed", ok: false, record: saved };
  }

  const verified = normalizeAnnualCalendarRecord(verifiedRow);
  const expectedContent = {
    annualDetails: payload.annualDetails,
    customItems: payload.customItems,
    placements: payload.placements,
    specialAlignments: payload.specialAlignments,
  };
  if (
    verified.id !== saved.id ||
    verified.version !== saved.version ||
    !annualCalendarContentEquals(annualCalendarContentFromRecord(verified), expectedContent)
  ) {
    return { code: "verification-failed", ok: false, record: verified };
  }

  const { error: auditError } = await admin.from("change_logs").insert({
    action: existing ? "updated" : "created",
    changed_by: user.id,
    new_data: verified,
    old_data: existing,
    record_id: verified.id,
    table_name: "annual_calendars",
  });

  if (auditError) {
    return { code: "audit-failed", ok: false, record: verified };
  }

  revalidatePath("/calendar");
  revalidatePath("/calendar/builder");
  revalidatePath("/calendar/preview");

  return { ok: true, record: verified };
}

