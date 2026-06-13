import { redirect } from "next/navigation";
import { requireApprovedProfile } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export default async function AdminIndexPage() {
  const { user } = await requireApprovedProfile();

  if (await hasPermission(user.id, "user_management", "manage")) {
    redirect("/admin/users");
  }

  if (await hasPermission(user.id, "permission_management", "manage")) {
    redirect("/admin/permissions");
  }

  if (await hasPermission(user.id, "change_logs", "preview")) {
    redirect("/admin/change-logs");
  }

  redirect("/dashboard?error=unauthorized");
}
