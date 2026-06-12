"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logChange } from "@/lib/change-logs/logChange";

export type LoginActionState = {
  error?: string;
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
