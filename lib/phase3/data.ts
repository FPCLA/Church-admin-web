import "server-only";

import { redirect } from "next/navigation";
import { requireApprovedProfile } from "@/lib/auth";
import { hasPermission, resolveEffectivePermissions } from "@/lib/permissions";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  phase3ModuleMap,
  type Phase3ModuleConfig,
  type Phase3ModuleName,
} from "@/lib/phase3/config";

export type LookupData = {
  events: Array<{ id: string; title: string | null; event_date: string | null }>;
  speakers: Array<{ id: string; name: string | null }>;
  serviceRoles: Array<{
    id: string;
    display_name_zh: string | null;
    display_name_en: string | null;
    display_order: number | null;
  }>;
};

export async function requireModuleContext(moduleName: Phase3ModuleName) {
  const { user, profile } = await requireApprovedProfile();
  const permissions = await resolveEffectivePermissions(user.id, moduleName);

  if (!permissions.preview) {
    redirect("/dashboard?error=unauthorized");
  }

  return { user, profile, permissions };
}

export async function getModuleRows(config: Phase3ModuleConfig) {
  const admin = getSupabaseAdminClient();
  const orderColumn = config.dateField || "created_at";
  const { data } = await admin
    .from(config.tableName)
    .select("*")
    .order(orderColumn, { ascending: false, nullsFirst: false })
    .limit(200);

  return (data || []) as Array<Record<string, unknown>>;
}

export async function getRecord(config: Phase3ModuleConfig, id: string) {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from(config.tableName)
    .select("*")
    .eq("id", id)
    .maybeSingle<Record<string, unknown>>();

  return data;
}

export async function getRowsByDate(config: Phase3ModuleConfig, date: string) {
  if (!config.dateField) {
    return [];
  }

  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from(config.tableName)
    .select("*")
    .eq(config.dateField, date)
    .order("created_at", { ascending: true });

  return (data || []) as Array<Record<string, unknown>>;
}

export async function getLookupData(): Promise<LookupData> {
  const admin = getSupabaseAdminClient();
  const [events, speakers, serviceRoles] = await Promise.all([
    admin
      .from("calendar_events")
      .select("id, title, event_date")
      .order("event_date", { ascending: false, nullsFirst: false })
      .limit(200),
    admin.from("speakers").select("id, name").order("name", { ascending: true }),
    admin
      .from("service_roles")
      .select("id, display_name_zh, display_name_en, display_order")
      .eq("active", true)
      .order("display_order", { ascending: true, nullsFirst: false }),
  ]);

  return {
    events: events.data || [],
    speakers: speakers.data || [],
    serviceRoles: serviceRoles.data || [],
  };
}

export async function getCoreModuleLinks(userId: string) {
  const entries = await Promise.all(
    Object.entries(phase3ModuleMap).map(async ([moduleName, config]) => ({
      moduleName: moduleName as Phase3ModuleName,
      href: config.basePath,
      visible: await hasPermission(userId, moduleName, "preview"),
    })),
  );

  return entries.filter((entry) => entry.visible);
}

export async function getBulletinForDate(date: string) {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("bulletins")
    .select("*")
    .eq("bulletin_date", date)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<Record<string, unknown>>();

  return data;
}

export async function getBulletinAutoFill(date: string) {
  const admin = getSupabaseAdminClient();
  const nextWeek = new Date(`${date}T00:00:00`);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekText = nextWeek.toISOString().slice(0, 10);

  const [events, classes, assignments, serviceAssignments, nextEvents] =
    await Promise.all([
      admin.from("calendar_events").select("*").eq("event_date", date),
      admin.from("sunday_school_classes").select("*").eq("class_date", date),
      admin
        .from("speaker_assignments")
        .select("*, speakers(name)")
        .eq("assignment_date", date),
      admin
        .from("service_assignments")
        .select("*, service_roles(display_name_zh, display_name_en)")
        .eq("service_date", date),
      admin.from("calendar_events").select("*").eq("event_date", nextWeekText),
    ]);

  const eventRows = (events.data || []) as Array<Record<string, unknown>>;
  const classRows = (classes.data || []) as Array<Record<string, unknown>>;
  const speakerRows = (assignments.data || []) as Array<Record<string, unknown>>;
  const serviceRows = (serviceAssignments.data || []) as Array<Record<string, unknown>>;
  const nextRows = (nextEvents.data || []) as Array<Record<string, unknown>>;

  return {
    calendar_event_id: String(eventRows[0]?.id || ""),
    title: eventRows[0]?.title ? `${eventRows[0].title} 週報` : `${date} 週報`,
    opening_text: eventRows
      .map((event) => joinParts([event.start_time, event.title, event.location]))
      .filter(Boolean)
      .join("\n"),
    sunday_school_text: classRows
      .map((item) =>
        joinParts([item.class_name, item.title || item.topic, item.teacher_name, item.location]),
      )
      .filter(Boolean)
      .join("\n"),
    worship_text: [
      ...speakerRows.map((item) => {
        const speaker = item.speakers as { name?: string | null } | null;
        return joinParts([item.meeting_type, speaker?.name, item.topic, item.scripture]);
      }),
      ...serviceRows.map((item) => {
        const role = item.service_roles as
          | { display_name_zh?: string | null; display_name_en?: string | null }
          | null;
        return joinParts([
          role?.display_name_zh || role?.display_name_en,
          item.person_name,
          item.backup_person_name ? `Backup: ${item.backup_person_name}` : "",
        ]);
      }),
    ]
      .filter(Boolean)
      .join("\n"),
    next_week_preview: nextRows
      .map((event) => joinParts([event.event_date, event.start_time, event.title, event.location]))
      .filter(Boolean)
      .join("\n"),
  };
}

function joinParts(parts: unknown[]) {
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" / ");
}
