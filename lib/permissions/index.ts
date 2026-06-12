import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type PermissionAction =
  | "preview"
  | "create"
  | "edit"
  | "delete"
  | "export"
  | "import"
  | "manage";

export type PermissionSet = Record<PermissionAction, boolean>;

const permissionColumns: Record<PermissionAction, keyof PermissionRow> = {
  preview: "can_preview",
  create: "can_create",
  edit: "can_edit",
  delete: "can_delete",
  export: "can_export",
  import: "can_import",
  manage: "can_manage",
};

const emptyPermissions: PermissionSet = {
  preview: false,
  create: false,
  edit: false,
  delete: false,
  export: false,
  import: false,
  manage: false,
};

type PermissionRow = {
  can_preview: boolean | null;
  can_create: boolean | null;
  can_edit: boolean | null;
  can_delete: boolean | null;
  can_export: boolean | null;
  can_import: boolean | null;
  can_manage: boolean | null;
};

type UserRoleRow = {
  role_id: string;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  roles: { name: string } | null;
};

export class PermissionError extends Error {
  constructor(
    public readonly moduleName: string,
    public readonly action: PermissionAction,
  ) {
    super(`Missing ${action} permission for ${moduleName}.`);
    this.name = "PermissionError";
  }
}

export async function resolveEffectivePermissions(
  userId: string,
  moduleName: string,
): Promise<PermissionSet> {
  const admin = getSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, active, approved")
    .eq("id", userId)
    .maybeSingle<{ id: string; active: boolean; approved: boolean }>();

  if (!profile?.active || !profile.approved) {
    return { ...emptyPermissions };
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: userRoles } = await admin
    .from("user_roles")
    .select("role_id, active, start_date, end_date, roles(name)")
    .eq("user_id", userId)
    .eq("active", true)
    .returns<UserRoleRow[]>();

  const activeRoles = (userRoles || []).filter((role) => {
    const startsOk = !role.start_date || role.start_date <= today;
    const endsOk = !role.end_date || role.end_date >= today;
    return role.active && startsOk && endsOk;
  });

  if (activeRoles.some((role) => role.roles?.name === "admin")) {
    return {
      preview: true,
      create: true,
      edit: true,
      delete: true,
      export: true,
      import: true,
      manage: true,
    };
  }

  const roleIds = activeRoles.map((role) => role.role_id);
  const permissions = { ...emptyPermissions };

  if (roleIds.length > 0) {
    const { data: rolePermissions } = await admin
      .from("permissions")
      .select(
        "can_preview, can_create, can_edit, can_delete, can_export, can_import, can_manage",
      )
      .in("role_id", roleIds)
      .in("module_name", [moduleName, "all"])
      .returns<PermissionRow[]>();

    for (const row of rolePermissions || []) {
      mergePermissionRow(permissions, row);
    }
  }

  const { data: override } = await admin
    .from("user_permission_overrides")
    .select(
      "can_preview, can_create, can_edit, can_delete, can_export, can_import, can_manage",
    )
    .eq("user_id", userId)
    .eq("module_name", moduleName)
    .maybeSingle<PermissionRow>();

  if (override) {
    applyOverride(permissions, override);
  }

  return permissions;
}

export async function hasPermission(
  userId: string,
  moduleName: string,
  action: PermissionAction,
) {
  const permissions = await resolveEffectivePermissions(userId, moduleName);
  return permissions[action];
}

export async function requirePermission(
  userId: string,
  moduleName: string,
  action: PermissionAction,
) {
  const allowed = await hasPermission(userId, moduleName, action);

  if (!allowed) {
    throw new PermissionError(moduleName, action);
  }
}

export async function hasRecordPermission(
  userId: string,
  moduleName: string,
  recordId: string,
  action: Extract<PermissionAction, "preview" | "edit" | "manage">,
) {
  if (await hasPermission(userId, moduleName, action)) {
    return true;
  }

  const column = permissionColumns[action];
  const admin = getSupabaseAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: assignment } = await admin
    .from("record_assignments")
    .select("start_date, end_date")
    .eq("user_id", userId)
    .eq("module_name", moduleName)
    .eq("record_id", recordId)
    .eq(column, true)
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .maybeSingle<{ start_date: string | null; end_date: string | null }>();

  return Boolean(assignment);
}

export async function requireRecordPermission(
  userId: string,
  moduleName: string,
  recordId: string,
  action: Extract<PermissionAction, "preview" | "edit" | "manage">,
) {
  const allowed = await hasRecordPermission(userId, moduleName, recordId, action);

  if (!allowed) {
    throw new PermissionError(moduleName, action);
  }
}

function mergePermissionRow(target: PermissionSet, row: PermissionRow) {
  for (const action of Object.keys(permissionColumns) as PermissionAction[]) {
    target[action] = target[action] || Boolean(row[permissionColumns[action]]);
  }
}

function applyOverride(target: PermissionSet, row: PermissionRow) {
  for (const action of Object.keys(permissionColumns) as PermissionAction[]) {
    const value = row[permissionColumns[action]];
    if (value !== null && value !== undefined) {
      target[action] = value;
    }
  }
}
