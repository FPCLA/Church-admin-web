"use server";

import { getCurrentUserAndProfile } from "@/lib/auth";
import { logChange } from "@/lib/change-logs/logChange";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const supportedLocales = new Set(["zh-TW", "en"]);

export async function updateLanguagePreference(locale: string) {
  if (!supportedLocales.has(locale)) {
    return { ok: false };
  }

  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) {
    return { ok: true };
  }

  const admin = getSupabaseAdminClient();
  await admin
    .from("profiles")
    .update({ language_preference: locale })
    .eq("id", user.id);

  await logChange({
    tableName: "profiles",
    recordId: user.id,
    action: "update_language_preference",
    oldData: { language_preference: profile?.language_preference },
    newData: { language_preference: locale },
    changedBy: user.id,
  });

  return { ok: true };
}
