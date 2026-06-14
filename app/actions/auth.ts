"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logChange } from "@/lib/change-logs/logChange";
import { getAppUrl } from "@/lib/env.server";

export type LoginActionState = {
  error?: string;
};

export type SetPasswordActionState = {
  error?: string;
};

export type ForgotPasswordActionState = {
  error?: string;
  success?: boolean;
};

export async function signInWithPassword(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "login.errors.required" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "login.errors.invalidCredentials" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "login.errors.invalidCredentials" };
  }

  const admin = getSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, approved, active")
    .eq("id", user.id)
    .maybeSingle<{ id: string; approved: boolean; active: boolean }>();

  if (!profile) {
    await supabase.auth.signOut();
    return { error: "login.errors.profileMissing" };
  }

  if (!profile.approved) {
    await supabase.auth.signOut();
    return { error: "login.errors.notApproved" };
  }

  if (!profile.active) {
    await supabase.auth.signOut();
    return { error: "login.errors.inactive" };
  }

  const lastLoginAt = new Date().toISOString();

  await admin
    .from("profiles")
    .update({ last_login_at: lastLoginAt })
    .eq("id", user.id);

  await logChange({
    tableName: "profiles",
    recordId: user.id,
    action: "update_last_login",
    newData: { last_login_at: lastLoginAt },
    changedBy: user.id,
  });

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  _previousState: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  if (!email) {
    return { error: "forgotPassword.errors.required" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getAppUrl()}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: "forgotPassword.errors.sendFailed" };
  }

  return { success: true };
}

export async function setPassword(
  _previousState: SetPasswordActionState,
  formData: FormData,
): Promise<SetPasswordActionState> {
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  if (!password || !confirmPassword) {
    return { error: "setPassword.errors.required" };
  }

  if (password.length < 8) {
    return { error: "setPassword.errors.tooShort" };
  }

  if (password !== confirmPassword) {
    return { error: "setPassword.errors.mismatch" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "setPassword.errors.sessionExpired" };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "setPassword.errors.updateFailed" };
  }

  const admin = getSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, approved, active")
    .eq("id", user.id)
    .maybeSingle<{ id: string; approved: boolean; active: boolean }>();

  if (!profile) {
    await supabase.auth.signOut();
    redirect("/login?error=profile_missing");
  }

  if (!profile.approved) {
    await supabase.auth.signOut();
    redirect("/login?error=not_approved");
  }

  if (!profile.active) {
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }

  const lastLoginAt = new Date().toISOString();

  await admin.from("profiles").update({ last_login_at: lastLoginAt }).eq("id", user.id);

  await logChange({
    tableName: "profiles",
    recordId: user.id,
    action: "password_set",
    newData: { last_login_at: lastLoginAt },
    changedBy: user.id,
  });

  redirect("/dashboard");
}
