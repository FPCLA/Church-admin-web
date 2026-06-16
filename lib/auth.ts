import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  active: boolean;
  approved: boolean;
  language_preference: string | null;
};

export async function getCurrentUserAndProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, active, approved, language_preference")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return { user, profile };
}

export async function requireApprovedProfile() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/login?error=profile_missing");
  }

  if (!profile.approved) {
    redirect("/login?error=not_approved");
  }

  if (!profile.active) {
    redirect("/login?error=inactive");
  }

  return { user, profile };
}
