import "server-only";
import { redirect } from "next/navigation";
import { requireApprovedProfile } from "@/lib/auth";
import { resolveEffectivePermissions } from "@/lib/permissions";

export async function requireModuleContext(moduleName: "calendar_events") {
  const { user, profile } = await requireApprovedProfile();
  const permissions = await resolveEffectivePermissions(user.id, moduleName);
  if (!permissions.preview) redirect("/dashboard?error=unauthorized");
  return { user, profile, permissions };
}
