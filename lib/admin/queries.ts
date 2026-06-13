import "server-only";

import { adminModules, permissionActions, permissionColumnByAction } from "@/lib/admin/constants";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PermissionAction } from "@/lib/permissions";

export type Role = {
  id: string;
  name: string;
  display_name_zh: string;
  display_name_en: string;
};

export type ProfileSummary = {
  id: string;
  full_name: string | null;
  email: string | null;
  active: boolean;
  approved: boolean;
  language_preference: string | null;
  last_login_at: string | null;
  created_at: string;
  notes: string | null;
};

export type UserRoleSummary = {
  id: string;
  user_id: string;
  role_id: string;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
};

export type PermissionRow = {
  id?: string;
  role_id?: string;
  user_id?: string;
  module_name: string;
  can_preview: boolean | null;
  can_create: boolean | null;
  can_edit: boolean | null;
  can_delete: boolean | null;
  can_export: boolean | null;
  can_import: boolean | null;
  can_manage: boolean | null;
};

export async function getRoles() {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("roles")
    .select("id, name, display_name_zh, display_name_en")
    .order("name")
    .returns<Role[]>();

  return data || [];
}

export async function getProfiles() {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("profiles")
    .select(
      "id, full_name, email, active, approved, language_preference, last_login_at, created_at, notes",
    )
    .order("created_at", { ascending: false })
    .returns<ProfileSummary[]>();

  return data || [];
}

export async function getUserRoles() {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("user_roles")
    .select("id, user_id, role_id, active, start_date, end_date")
    .order("created_at", { ascending: false })
    .returns<UserRoleSummary[]>();

  return data || [];
}

export async function getRolePermissions(roleId: string) {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("permissions")
    .select(
      "id, role_id, module_name, can_preview, can_create, can_edit, can_delete, can_export, can_import, can_manage",
    )
    .eq("role_id", roleId)
    .returns<PermissionRow[]>();

  return indexPermissionRows(data || []);
}

export async function getUserOverrides(userId: string) {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("user_permission_overrides")
    .select(
      "id, user_id, module_name, can_preview, can_create, can_edit, can_delete, can_export, can_import, can_manage",
    )
    .eq("user_id", userId)
    .returns<PermissionRow[]>();

  return indexPermissionRows(data || []);
}

export async function getRecordAssignments() {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("record_assignments")
    .select(
      "id, user_id, module_name, record_id, can_preview, can_edit, can_manage, start_date, end_date",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return data || [];
}

export function emptyPermissionRow(moduleName: string): PermissionRow {
  return {
    module_name: moduleName,
    can_preview: false,
    can_create: false,
    can_edit: false,
    can_delete: false,
    can_export: false,
    can_import: false,
    can_manage: false,
  };
}

export function getPermissionValue(
  row: PermissionRow | undefined,
  action: PermissionAction,
) {
  return row?.[permissionColumnByAction[action] as keyof PermissionRow] ?? false;
}

export function parsePermissionForm(formData: FormData, nullable: boolean) {
  const rows = adminModules.map((moduleName) => {
    const row: Record<string, string | boolean | null> = { module_name: moduleName };

    for (const action of permissionActions) {
      const column = permissionColumnByAction[action];
      if (nullable) {
        const value = String(formData.get(`${moduleName}:${action}`) || "inherit");
        row[column] =
          value === "allow" ? true : value === "deny" ? false : null;
      } else {
        row[column] = formData.get(`${moduleName}:${action}`) === "on";
      }
    }

    return row;
  });

  return rows;
}

function indexPermissionRows(rows: PermissionRow[]) {
  return rows.reduce<Record<string, PermissionRow>>((acc, row) => {
    acc[row.module_name] = row;
    return acc;
  }, {});
}
