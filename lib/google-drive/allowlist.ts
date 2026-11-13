import "server-only";

import { DRIVE_FOLDER_KEY_PATTERN } from "@/lib/google-drive/policy";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type ActiveDriveFolder = {
  id: string;
  folder_key: string;
  drive_folder_id: string;
  display_name: string;
  module_name: string | null;
  description: string | null;
  last_sync_status: string;
  last_synced_at: string | null;
  last_sync_error: string | null;
};

export class DriveAllowlistError extends Error {
  constructor(message = "Google Drive folder is not in the active allowlist.") {
    super(message);
    this.name = "DriveAllowlistError";
  }
}

export function normalizeDriveFolderKey(raw: string) {
  const folderKey = raw.trim().toLowerCase();

  if (!DRIVE_FOLDER_KEY_PATTERN.test(folderKey)) {
    throw new DriveAllowlistError("Invalid Google Drive folder key.");
  }

  return folderKey;
}

export async function listActiveDriveFolders() {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("drive_folders")
    .select(
      "id, folder_key, drive_folder_id, display_name, module_name, description, last_sync_status, last_synced_at, last_sync_error",
    )
    .eq("active", true)
    .order("display_name", { ascending: true })
    .returns<ActiveDriveFolder[]>();

  if (error) {
    throw new Error("Unable to read Google Drive folder allowlist.");
  }

  return data || [];
}

export async function getActiveDriveFolderByKey(rawFolderKey: string) {
  const folderKey = normalizeDriveFolderKey(rawFolderKey);
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("drive_folders")
    .select(
      "id, folder_key, drive_folder_id, display_name, module_name, description, last_sync_status, last_synced_at, last_sync_error",
    )
    .eq("folder_key", folderKey)
    .eq("active", true)
    .eq("purpose", "system_output")
    .eq("module_name", "calendar_events")
    .maybeSingle<ActiveDriveFolder>();

  if (error) {
    throw new Error("Unable to read Google Drive folder allowlist.");
  }

  if (!data) {
    throw new DriveAllowlistError();
  }

  return data;
}
