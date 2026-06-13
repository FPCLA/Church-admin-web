"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parsePermissionForm } from "@/lib/admin/queries";
import { requireAdminPagePermission } from "@/lib/admin/access";
import { logChange } from "@/lib/change-logs/logChange";
import { getAppUrl } from "@/lib/env.server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type ProfileRecord = {
  id: string;
  full_name: string | null;
  email: string | null;
  active: boolean;
  approved: boolean;
  notes: string | null;
};

export async function createCoworker(formData: FormData) {
  const { user } = await requireAdminPagePermission("user_management", "manage");
  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const roleId = String(formData.get("role_id") || "");
  const notes = String(formData.get("notes") || "").trim() || null;
  const approved = formData.get("approved") === "on";
  const active = formData.get("active") === "on";

  if (!email) {
    redirect("/admin/users?status=missing_email");
  }

  const admin = getSupabaseAdminClient();
  const { data: existingUsers } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const existingUser = existingUsers?.users.find(
    (authUser) => authUser.email?.toLowerCase() === email,
  );
  let authUserId = existingUser?.id;
  let inviteSent = false;

  const passwordRedirectTo = `${getAppUrl()}/auth/callback?next=/set-password`;

  if (!authUserId) {
    const { data: authData, error: authError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: passwordRedirectTo,
    });

    if (authError || !authData.user) {
      redirect("/admin/users?status=invite_failed");
    }

    authUserId = authData.user.id;
    inviteSent = true;
  } else {
    const { error: inviteError } = await admin.auth.resetPasswordForEmail(email, {
      redirectTo: passwordRedirectTo,
    });

    if (inviteError) {
      redirect("/admin/users?status=invite_failed");
    }

    inviteSent = true;
  }

  const now = new Date().toISOString();
  const profile = {
    id: authUserId,
    full_name: fullName || null,
    email,
    active,
    approved,
    notes,
    language_preference: "zh-TW",
    approved_by: approved ? user.id : null,
    approved_at: approved ? now : null,
  };

  const { error } = await admin.from("profiles").upsert(profile);

  if (error) {
    redirect("/admin/users?status=profile_failed");
  }

  await logChange({
    tableName: "profiles",
    recordId: authUserId,
    action: "user_created",
    newData: { ...profile, invite_sent: inviteSent },
    changedBy: user.id,
  });

  if (roleId) {
    await admin.from("user_roles").insert({
      user_id: authUserId,
      role_id: roleId,
      active: true,
      assigned_by: user.id,
    });
    await logChange({
      tableName: "user_roles",
      recordId: authUserId,
      action: "role_assigned",
      newData: { user_id: authUserId, role_id: roleId },
      changedBy: user.id,
    });
  }

  revalidatePath("/admin/users");
  redirect(`/admin/users?status=${inviteSent ? "invited" : "saved"}`);
}

export async function updateUserProfile(formData: FormData) {
  const { user } = await requireAdminPagePermission("user_management", "manage");
  const profileId = String(formData.get("profile_id") || "");
  const fullName = String(formData.get("full_name") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  const admin = getSupabaseAdminClient();
  const { data: oldData } = await admin
    .from("profiles")
    .select("id, full_name, email, active, approved, notes")
    .eq("id", profileId)
    .maybeSingle<ProfileRecord>();

  await admin.from("profiles").update({ full_name: fullName, notes }).eq("id", profileId);
  await logChange({
    tableName: "profiles",
    recordId: profileId,
    action: "user_updated",
    oldData,
    newData: { full_name: fullName, notes },
    changedBy: user.id,
  });

  revalidatePath("/admin/users");
  redirect("/admin/users?status=saved");
}

export async function sendPasswordSetupEmail(formData: FormData) {
  const { user } = await requireAdminPagePermission("user_management", "manage");
  const profileId = String(formData.get("profile_id") || "");
  const admin = getSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email")
    .eq("id", profileId)
    .maybeSingle<{ id: string; email: string | null }>();

  if (!profile?.email) {
    redirect("/admin/users?status=missing_email");
  }

  const { error } = await admin.auth.resetPasswordForEmail(profile.email, {
    redirectTo: `${getAppUrl()}/auth/callback?next=/set-password`,
  });

  if (error) {
    redirect("/admin/users?status=invite_failed");
  }

  await logChange({
    tableName: "profiles",
    recordId: profile.id,
    action: "password_setup_email_sent",
    newData: { email: profile.email },
    changedBy: user.id,
  });

  revalidatePath("/admin/users");
  redirect("/admin/users?status=invited");
}

export async function approveUser(formData: FormData) {
  await setUserApprovalState(formData, true);
}

export async function disableUser(formData: FormData) {
  await setUserActiveState(formData, false);
}

export async function enableUser(formData: FormData) {
  await setUserActiveState(formData, true);
}

export async function assignRole(formData: FormData) {
  const { user } = await requireAdminPagePermission("user_management", "manage");
  const userId = String(formData.get("user_id") || "");
  const roleId = String(formData.get("role_id") || "");
  const startDate = String(formData.get("start_date") || "") || null;
  const endDate = String(formData.get("end_date") || "") || null;

  const admin = getSupabaseAdminClient();
  const row = {
    user_id: userId,
    role_id: roleId,
    active: true,
    start_date: startDate,
    end_date: endDate,
    assigned_by: user.id,
    assigned_at: new Date().toISOString(),
  };

  const { data } = await admin.from("user_roles").insert(row).select("id").single<{ id: string }>();
  await logChange({
    tableName: "user_roles",
    recordId: data?.id || userId,
    action: "role_assigned",
    newData: row,
    changedBy: user.id,
  });

  revalidatePath("/admin/users");
  redirect("/admin/users?status=saved");
}

export async function removeRole(formData: FormData) {
  const { user } = await requireAdminPagePermission("user_management", "manage");
  const userRoleId = String(formData.get("user_role_id") || "");
  const admin = getSupabaseAdminClient();

  const { data: oldData } = await admin
    .from("user_roles")
    .select("*")
    .eq("id", userRoleId)
    .maybeSingle();

  await admin.from("user_roles").update({ active: false }).eq("id", userRoleId);
  await logChange({
    tableName: "user_roles",
    recordId: userRoleId,
    action: "role_removed",
    oldData,
    newData: { active: false },
    changedBy: user.id,
  });

  revalidatePath("/admin/users");
  redirect("/admin/users?status=saved");
}

export async function saveRolePermissions(formData: FormData) {
  const { user } = await requireAdminPagePermission("permission_management", "manage");
  const roleId = String(formData.get("role_id") || "");
  const admin = getSupabaseAdminClient();
  const rows = parsePermissionForm(formData, false).map((row) => ({
    ...row,
    role_id: roleId,
  }));

  for (const row of rows) {
    await admin.from("permissions").upsert(row, { onConflict: "role_id,module_name" });
  }

  await logChange({
    tableName: "permissions",
    recordId: roleId,
    action: "permission_changed",
    newData: rows,
    changedBy: user.id,
  });

  revalidatePath("/admin/permissions");
  redirect(`/admin/permissions?role=${roleId}&status=saved`);
}

export async function saveUserOverrides(formData: FormData) {
  const { user } = await requireAdminPagePermission("permission_management", "manage");
  const userId = String(formData.get("user_id") || "");
  const admin = getSupabaseAdminClient();
  const rows = parsePermissionForm(formData, true).map((row) => ({
    ...row,
    user_id: userId,
    assigned_by: user.id,
  }));

  for (const row of rows) {
    await admin
      .from("user_permission_overrides")
      .upsert(row, { onConflict: "user_id,module_name" });
  }

  await logChange({
    tableName: "user_permission_overrides",
    recordId: userId,
    action: "user_permission_override_changed",
    newData: rows,
    changedBy: user.id,
  });

  revalidatePath("/admin/permissions");
  redirect(`/admin/permissions?user=${userId}&status=saved`);
}

export async function saveRecordAssignment(formData: FormData) {
  const { user } = await requireAdminPagePermission("permission_management", "manage");
  const admin = getSupabaseAdminClient();
  const row = {
    user_id: String(formData.get("user_id") || ""),
    module_name: String(formData.get("module_name") || ""),
    record_id: String(formData.get("record_id") || ""),
    can_preview: formData.get("can_preview") === "on",
    can_edit: formData.get("can_edit") === "on",
    can_manage: formData.get("can_manage") === "on",
    start_date: String(formData.get("start_date") || "") || null,
    end_date: String(formData.get("end_date") || "") || null,
    assigned_by: user.id,
  };

  const { data } = await admin
    .from("record_assignments")
    .insert(row)
    .select("id")
    .single<{ id: string }>();

  await logChange({
    tableName: "record_assignments",
    recordId: data?.id || row.record_id,
    action: "record_assignment_changed",
    newData: row,
    changedBy: user.id,
  });

  revalidatePath("/admin/permissions");
  redirect("/admin/permissions?status=saved");
}

async function setUserApprovalState(formData: FormData, approved: boolean) {
  const { user } = await requireAdminPagePermission("user_management", "manage");
  const profileId = String(formData.get("profile_id") || "");
  const admin = getSupabaseAdminClient();
  const { data: oldData } = await admin
    .from("profiles")
    .select("id, full_name, email, active, approved, notes")
    .eq("id", profileId)
    .maybeSingle<ProfileRecord>();

  const update = {
    approved,
    approved_by: approved ? user.id : null,
    approved_at: approved ? new Date().toISOString() : null,
  };

  await admin.from("profiles").update(update).eq("id", profileId);
  await logChange({
    tableName: "profiles",
    recordId: profileId,
    action: approved ? "user_approved" : "user_updated",
    oldData,
    newData: update,
    changedBy: user.id,
  });

  revalidatePath("/admin/users");
  redirect("/admin/users?status=saved");
}

async function setUserActiveState(formData: FormData, active: boolean) {
  const { user } = await requireAdminPagePermission("user_management", "manage");
  const profileId = String(formData.get("profile_id") || "");
  const admin = getSupabaseAdminClient();
  const { data: oldData } = await admin
    .from("profiles")
    .select("id, full_name, email, active, approved, notes")
    .eq("id", profileId)
    .maybeSingle<ProfileRecord>();

  await admin.from("profiles").update({ active }).eq("id", profileId);
  await logChange({
    tableName: "profiles",
    recordId: profileId,
    action: active ? "user_enabled" : "user_disabled",
    oldData,
    newData: { active },
    changedBy: user.id,
  });

  revalidatePath("/admin/users");
  redirect("/admin/users?status=saved");
}
