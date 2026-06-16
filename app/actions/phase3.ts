"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApprovedProfile } from "@/lib/auth";
import { logChange } from "@/lib/change-logs/logChange";
import {
  phase3ModuleMap,
  type Phase3Field,
  type Phase3ModuleConfig,
  type Phase3ModuleName,
} from "@/lib/phase3/config";
import { getBulletinAutoFill } from "@/lib/phase3/data";
import { requirePermission } from "@/lib/permissions";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function createPhase3Record(formData: FormData) {
  const moduleName = String(formData.get("module_name") || "") as Phase3ModuleName;
  const config = phase3ModuleMap[moduleName];

  if (!config) {
    redirect("/dashboard");
  }

  const { user } = await requireApprovedProfile();
  await requirePermission(user.id, moduleName, "create");

  const row = buildRow(config, formData);
  const auditRow = hasAuditColumns(config)
    ? { ...row, created_by: user.id, updated_by: user.id }
    : row;

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from(config.tableName)
    .insert(auditRow)
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    redirect(`${config.basePath}?status=failed`);
  }

  await logChange({
    tableName: config.tableName,
    recordId: data.id,
    action: "created",
    newData: auditRow,
    changedBy: user.id,
  });

  revalidatePath(config.basePath);
  redirect(recordPath(config, data.id, row));
}

export async function updatePhase3Record(formData: FormData) {
  const moduleName = String(formData.get("module_name") || "") as Phase3ModuleName;
  const config = phase3ModuleMap[moduleName];
  const id = String(formData.get("id") || "");

  if (!config || !id) {
    redirect("/dashboard");
  }

  const { user } = await requireApprovedProfile();
  await requirePermission(user.id, moduleName, "edit");

  const admin = getSupabaseAdminClient();
  const { data: oldData } = await admin
    .from(config.tableName)
    .select("*")
    .eq("id", id)
    .maybeSingle<Record<string, unknown>>();

  const row = buildRow(config, formData);
  const update = hasAuditColumns(config)
    ? {
        ...row,
        updated_by: user.id,
        version: Number(oldData?.version || 1) + 1,
      }
    : row;

  const { error } = await admin.from(config.tableName).update(update).eq("id", id);

  if (error) {
    redirect(`${config.basePath}?status=failed`);
  }

  await logChange({
    tableName: config.tableName,
    recordId: id,
    action: "updated",
    oldData,
    newData: update,
    changedBy: user.id,
  });

  revalidatePath(config.basePath);
  redirect(`${recordPath(config, id, row)}?status=saved`);
}

export async function deletePhase3Record(formData: FormData) {
  const moduleName = String(formData.get("module_name") || "") as Phase3ModuleName;
  const config = phase3ModuleMap[moduleName];
  const id = String(formData.get("id") || "");
  const confirmed = formData.get("confirm_delete") === "on";

  if (!config || !id || !confirmed) {
    redirect("/dashboard");
  }

  const { user } = await requireApprovedProfile();
  await requirePermission(user.id, moduleName, "delete");

  const admin = getSupabaseAdminClient();
  const { data: oldData } = await admin
    .from(config.tableName)
    .select("*")
    .eq("id", id)
    .maybeSingle<Record<string, unknown>>();

  const { error } = await admin.from(config.tableName).delete().eq("id", id);

  if (error) {
    redirect(`${config.basePath}?status=failed`);
  }

  await logChange({
    tableName: config.tableName,
    recordId: id,
    action: "deleted",
    oldData,
    changedBy: user.id,
  });

  revalidatePath(config.basePath);
  redirect(`${config.basePath}?status=deleted`);
}

export async function autoFillBulletin(formData: FormData) {
  const date = String(formData.get("bulletin_date") || new Date().toISOString().slice(0, 10));
  redirect(`/bulletins/${date}?auto=1`);
}

export async function openDatedModule(formData: FormData) {
  const moduleName = String(formData.get("module_name") || "") as Phase3ModuleName;
  const config = phase3ModuleMap[moduleName];
  const date = String(formData.get("date") || new Date().toISOString().slice(0, 10));

  if (!config?.detailsByDate) {
    redirect("/dashboard");
  }

  redirect(`${config.basePath}/${date}`);
}

export async function buildBulletinDefaults(date: string, existing?: Record<string, unknown> | null) {
  const autoFill = await getBulletinAutoFill(date);

  return {
    bulletin_date: date,
    title: existing?.title || autoFill.title,
    calendar_event_id: existing?.calendar_event_id || autoFill.calendar_event_id,
    opening_text: existing?.opening_text || autoFill.opening_text,
    sunday_school_text: existing?.sunday_school_text || autoFill.sunday_school_text,
    worship_text: existing?.worship_text || autoFill.worship_text,
    announcements: existing?.announcements || "",
    prayer_requests: existing?.prayer_requests || "",
    next_week_preview: existing?.next_week_preview || autoFill.next_week_preview,
    notes: existing?.notes || "",
  };
}

function buildRow(config: Phase3ModuleConfig, formData: FormData) {
  const row: Record<string, unknown> = {};

  for (const field of config.formFields) {
    row[field.name] = parseField(field, formData);
  }

  if (config.moduleName === "bulletins") {
    row.searchable_text = [
      row.title,
      row.opening_text,
      row.sunday_school_text,
      row.worship_text,
      row.announcements,
      row.prayer_requests,
      row.next_week_preview,
      row.notes,
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join("\n");
  }

  return row;
}

function parseField(field: Phase3Field, formData: FormData) {
  if (field.type === "checkbox") {
    return formData.get(field.name) === "on";
  }

  if (field.name === "display_order") {
    const value = String(formData.get(field.name) || "").trim();
    return value ? Number(value) : null;
  }

  const raw = String(formData.get(field.name) || "").trim();
  return raw || null;
}

function hasAuditColumns(config: Phase3ModuleConfig) {
  return config.moduleName !== "service_roles";
}

function recordPath(config: Phase3ModuleConfig, id: string, row: Record<string, unknown>) {
  if (config.moduleName === "service_assignments") {
    return `${config.basePath}/${row.service_date || id}`;
  }

  if (config.moduleName === "bulletins") {
    return `${config.basePath}/${row.bulletin_date || id}`;
  }

  if (config.moduleName === "service_roles") {
    return config.basePath;
  }

  return `${config.basePath}/${id}`;
}
