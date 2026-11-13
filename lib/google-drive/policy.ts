import "server-only";

export const googleDriveSecurityPrinciples = [
  "Google Drive access is server-side only.",
  "Google credentials must never appear in client components, browser bundles, public logs, or git.",
  "Domain-wide delegation is not used.",
  "The Google service account must only be shared into approved folders.",
  "The app must not provide a full Google Drive browser.",
  "The app must not list Google Drive root.",
  "The app must not list every shared-with-me file.",
  "The app must not search the whole Google Drive.",
  "Users must not submit arbitrary Google Drive folder IDs or file IDs for lookup.",
  "Every Drive operation must start from an active folder in the Supabase allowlist.",
] as const;

export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
export const GOOGLE_DRIVE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_DRIVE_API_BASE_URL = "https://www.googleapis.com/drive/v3";

export const DRIVE_FOLDER_KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{1,63}$/;
export const DRIVE_ID_PATTERN = /^[A-Za-z0-9_-]{10,}$/;

export function assertSafeDriveId(id: string, label: string) {
  if (!DRIVE_ID_PATTERN.test(id) || ["root", "sharedwithme"].includes(id.toLowerCase())) {
    throw new Error(`Unsafe Google Drive ${label}.`);
  }
}
