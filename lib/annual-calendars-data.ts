import "server-only";

import { normalizeAnnualCalendarRecord } from "@/lib/annual-calendars";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getAnnualCalendar(calendarYear: number) {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("annual_calendars")
    .select("*")
    .eq("calendar_year", calendarYear)
    .maybeSingle<Record<string, unknown>>();

  if (error) {
    throw new Error(`Unable to load annual calendar (${error.code}).`);
  }

  return data ? normalizeAnnualCalendarRecord(data) : null;
}

export async function getAnnualCalendarSummaries() {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("annual_calendars")
    .select("calendar_year, updated_at")
    .order("calendar_year", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Unable to load annual calendar summaries (${error.code}).`);
  }

  return (data || []).map((row) => ({
    calendarYear: Number(row.calendar_year),
    updatedAt: String(row.updated_at || ""),
  }));
}

