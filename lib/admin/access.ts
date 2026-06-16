import "server-only";

import { redirect } from "next/navigation";
import { requireApprovedProfile } from "@/lib/auth";
import { logChange } from "@/lib/change-logs/logChange";
import { hasPermission, type PermissionAction } from "@/lib/permissions";

export async function requireAdminPagePermission(
  moduleName: string,
  action: PermissionAction,
) {
  const { user, profile } = await requireApprovedProfile();
  const allowed = await hasPermission(user.id, moduleName, action);

  if (!allowed) {
    await logChange({
      tableName: "admin_access",
      action: "unauthorized_access",
      newData: { module_name: moduleName, action },
      changedBy: user.id,
    });
    redirect("/dashboard?error=unauthorized");
  }

  return { user, profile };
}
