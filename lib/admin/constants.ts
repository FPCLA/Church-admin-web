import type { PermissionAction } from "@/lib/permissions";

export const adminModules = [
  "calendar_events",
  "sunday_school_classes",
  "speakers",
  "speaker_assignments",
  "service_roles",
  "service_assignments",
  "bulletins",
  "drive_files",
  "imports",
  "exports",
  "search",
  "user_management",
  "permission_management",
  "change_logs",
] as const;

export type AdminModule = (typeof adminModules)[number];

export const permissionActions: PermissionAction[] = [
  "preview",
  "create",
  "edit",
  "delete",
  "export",
  "import",
  "manage",
];

export const permissionColumnByAction: Record<PermissionAction, string> = {
  preview: "can_preview",
  create: "can_create",
  edit: "can_edit",
  delete: "can_delete",
  export: "can_export",
  import: "can_import",
  manage: "can_manage",
};

export const roleOrder = [
  "admin",
  "session_member",
  "deacon_board",
  "sunday_school_teacher",
  "sunday_school_coordinator",
  "speaker_coordinator",
  "service_scheduler",
  "bulletin_editor",
  "ministry_coworker",
  "viewer",
] as const;
