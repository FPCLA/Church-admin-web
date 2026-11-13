import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// The caller must already have obtained userId from the verified website session.
// A database error or any non-boolean answer fails closed.
export async function isDriveAdministrator(userId: string): Promise<boolean> {
  try {
    const { data, error } = await getSupabaseAdminClient().rpc("is_admin", { check_user: userId });
    return !error && data === true;
  } catch {
    return false;
  }
}
