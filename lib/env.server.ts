import "server-only";

import { getSupabasePublicEnv } from "@/lib/env";

export function getSupabaseServiceRoleEnv() {
  const { url } = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { url, serviceRoleKey };
}

export function getAppUrl() {
  return process.env.APP_URL || "http://localhost:3000";
}
