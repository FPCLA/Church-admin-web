import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type LogChangeInput = {
  tableName: string;
  recordId?: string | null;
  action: string;
  oldData?: unknown;
  newData?: unknown;
  changedBy?: string | null;
};

export async function logChange({
  tableName,
  recordId,
  action,
  oldData = null,
  newData = null,
  changedBy = null,
}: LogChangeInput) {
  const admin = getSupabaseAdminClient();

  await admin.from("change_logs").insert({
    table_name: tableName,
    record_id: recordId,
    action,
    old_data: oldData,
    new_data: newData,
    changed_by: changedBy,
  });
}
