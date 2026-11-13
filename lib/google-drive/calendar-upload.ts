import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { getActiveDriveFolderByKey } from "@/lib/google-drive/allowlist";
import { assertSafeDriveId } from "@/lib/google-drive/policy";

const driveFileScope = "https://www.googleapis.com/auth/drive.file";
const permittedScopes = new Set([driveFileScope]);
const docxType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const folderType = "application/vnd.google-apps.folder";
const maxDocumentBytes = 1024 * 1024;

export class CalendarDriveUploadError extends Error {
  constructor(public readonly code: string, public readonly fileId?: string) {
    super(code);
    this.name = "CalendarDriveUploadError";
  }
}

type CalendarDriveConfig = { clientId: string; clientSecret: string; refreshToken: string; ownerEmail: string; folderKey: string };
type PreparedDestination = { accessToken: string; folderId: string };
type CalendarUpload = { requestId: string; year: number; version: number; document: Buffer };

export function getCalendarDriveConfig(): CalendarDriveConfig {
  const config = {
    clientId: process.env.CALENDAR_GOOGLE_OAUTH_CLIENT_ID || "",
    clientSecret: process.env.CALENDAR_GOOGLE_OAUTH_CLIENT_SECRET || "",
    refreshToken: process.env.CALENDAR_GOOGLE_OAUTH_REFRESH_TOKEN || "",
    ownerEmail: process.env.CALENDAR_GOOGLE_OWNER_EMAIL || "",
    folderKey: process.env.CALENDAR_DRIVE_EXPORT_FOLDER_KEY || "",
  };
  if (!/^[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(config.clientId) ||
      !config.clientSecret || !config.refreshToken || /\s/.test(config.clientSecret + config.refreshToken) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.ownerEmail) ||
      !/^[a-z0-9][a-z0-9_-]{1,63}$/.test(config.folderKey)) throw new CalendarDriveUploadError("not_configured");
  return config;
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  if (!response.ok || !response.body || response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json")
    throw new CalendarDriveUploadError("google_request_failed");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) throw new Error("response too large");
      chunks.push(value);
    }
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid response");
    return value as Record<string, unknown>;
  } catch { throw new CalendarDriveUploadError("google_request_failed"); }
  finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

function googleRequest(url: string, init: RequestInit = {}) {
  return fetch(url, {...init, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(20000)});
}

// Only an explicitly configured, active folder is usable. No browser-supplied Drive ID is accepted.
export async function prepareCalendarDriveDestination(config: CalendarDriveConfig): Promise<PreparedDestination> {
  try {
    const folder = await getActiveDriveFolderByKey(config.folderKey);
    if (folder.module_name && folder.module_name !== "calendar_events") throw new CalendarDriveUploadError("folder_not_authorized");
    assertSafeDriveId(folder.drive_folder_id, "folder id");
    const tokenResponse = await googleRequest("https://oauth2.googleapis.com/token", {
      method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded", Accept: "application/json"},
      body: new URLSearchParams({client_id: config.clientId, client_secret: config.clientSecret,
        refresh_token: config.refreshToken, grant_type: "refresh_token"}),
    });
    const token = await readJson(tokenResponse);
    const scopes = typeof token.scope === "string" ? token.scope.split(/\s+/).filter(Boolean) : [];
    if (typeof token.access_token !== "string" || !token.access_token || /\s/.test(token.access_token) ||
        typeof token.token_type !== "string" || token.token_type.toLowerCase() !== "bearer" ||
        !scopes.includes(driveFileScope) || scopes.some(scope => !permittedScopes.has(scope)))
      throw new CalendarDriveUploadError("authorization_invalid");
    const headers = {Authorization: `Bearer ${token.access_token}`, Accept: "application/json"};
    const about = await readJson(await googleRequest("https://www.googleapis.com/drive/v3/about?fields=user%28emailAddress%29", {headers}));
    const owner = about.user as Record<string, unknown> | undefined;
    if (!owner || typeof owner.emailAddress !== "string" ||
        owner.emailAddress.toLowerCase() !== config.ownerEmail.toLowerCase()) throw new CalendarDriveUploadError("authorization_invalid");
    const folderUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folder.drive_folder_id)}?fields=id%2CmimeType%2Ctrashed%2Ccapabilities%28canAddChildren%29`;
    const remote = await readJson(await googleRequest(folderUrl, {headers}));
    const capabilities = remote.capabilities as Record<string, unknown> | undefined;
    if (remote.id !== folder.drive_folder_id || remote.mimeType !== folderType || remote.trashed !== false ||
        !capabilities || capabilities.canAddChildren !== true) throw new CalendarDriveUploadError("folder_not_authorized");
    return {accessToken: token.access_token, folderId: folder.drive_folder_id};
  } catch (error) {
    if (error instanceof CalendarDriveUploadError) throw error;
    throw new CalendarDriveUploadError("google_request_failed");
  }
}

// Confirm only a server-recorded file in the already authorized destination.
// A missing, moved, trashed, or unverifiable file is never reported as saved.
export async function confirmSavedCalendarInDrive(destination: PreparedDestination, fileId: string, requestId: string, expectedMd5?: string) {
  try {
    assertSafeDriveId(destination.folderId, "folder id");
    assertSafeDriveId(fileId, "file id");
    if (!/^[a-f0-9]{32}$/.test(requestId)) throw new Error("invalid request id");
    if (expectedMd5 !== undefined && !/^[a-f0-9]{32}$/.test(expectedMd5)) throw new Error("invalid checksum");
    const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id%2CmimeType%2Ctrashed%2Cparents%2CappProperties%2Cmd5Checksum`;
    const file = await readJson(await googleRequest(url, {headers: {Authorization: `Bearer ${destination.accessToken}`, Accept: "application/json"}}));
    const properties = file.appProperties as Record<string, unknown> | undefined;
    // Older saved files predate content checksums. For newer files, do not
    // report a changed or malformed file as the content originally exported.
    const hasContentMd5 = !!properties && Object.prototype.hasOwnProperty.call(properties, "fpclaContentMd5");
    const contentMd5 = properties?.fpclaContentMd5;
    if (file.id !== fileId || file.mimeType !== docxType || file.trashed !== false ||
        !Array.isArray(file.parents) || file.parents.length !== 1 || file.parents[0] !== destination.folderId ||
        !properties || properties.fpclaRequestId !== requestId ||
        (hasContentMd5 && (typeof contentMd5 !== "string" || !/^[a-f0-9]{32}$/.test(contentMd5) || file.md5Checksum !== contentMd5)) ||
        (expectedMd5 !== undefined && (properties.fpclaContentMd5 !== expectedMd5 || file.md5Checksum !== expectedMd5)))
      throw new Error("file mismatch");
    return hasContentMd5;
  } catch { throw new CalendarDriveUploadError("needs_review"); }
}

// The caller must reserve an export receipt before invoking this function. It never retries a write.
export async function uploadSavedCalendarToDrive(destination: PreparedDestination, input: CalendarUpload) {
  if (!/^[a-f0-9]{32}$/.test(input.requestId) || !Number.isInteger(input.year) || input.year < 2000 || input.year > 2100 ||
      !Number.isSafeInteger(input.version) || input.version < 1 || !Buffer.isBuffer(input.document) ||
      input.document.length < 4 || input.document.length > maxDocumentBytes ||
      !input.document.subarray(0, 4).equals(Buffer.from([80, 75, 3, 4]))) throw new CalendarDriveUploadError("invalid_document");
  assertSafeDriveId(destination.folderId, "folder id");
  const fileName = `FPCLA-${input.year}-行事曆-v${input.version}-${input.requestId.slice(0, 12)}.docx`;
  const boundary = `fpcla_${randomBytes(16).toString("hex")}`;
  const contentMd5 = createHash("md5").update(input.document).digest("hex");
  const metadata = {name: fileName, mimeType: docxType, parents: [destination.folderId],
    appProperties: {fpclaRequestId: input.requestId, fpclaContentMd5: contentMd5}};
  const payload = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${docxType}\r\n\r\n`), input.document,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  let fileId: string | undefined;
  try {
    const response = await googleRequest("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id%2Cname%2Cparents%2CmimeType%2Ctrashed", {
      method: "POST", headers: {Authorization: `Bearer ${destination.accessToken}`, Accept: "application/json",
        "Content-Type": `multipart/related; boundary=${boundary}`}, body: new Uint8Array(payload),
    });
    const file = await readJson(response);
    if (typeof file.id !== "string" || file.name !== fileName || file.mimeType !== docxType || file.trashed !== false ||
        !Array.isArray(file.parents) || file.parents.length !== 1 || file.parents[0] !== destination.folderId)
      throw new CalendarDriveUploadError("needs_review");
    assertSafeDriveId(file.id, "file id");
    fileId = file.id;
    // An upload response confirms the destination, but not the bytes saved by
    // Drive. Verify the new file before allowing its receipt to become saved.
    // Failure remains an uncertain upload: the caller must not upload again.
    await confirmSavedCalendarInDrive(destination, fileId, input.requestId, contentMd5);
    return fileId;
  } catch {
    throw new CalendarDriveUploadError("needs_review", fileId);
  }
}
