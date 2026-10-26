import { NextResponse } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { resolveEffectivePermissions } from "@/lib/permissions";
import { packCalendarWordDocument } from "@/lib/calendar-word-export";
import { boundedCalendarExportBody, isCalendarWordExportPayload } from "@/lib/calendar-export-validation";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!profile?.active || !profile.approved) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  const permissions = await resolveEffectivePermissions(user.id, "calendar_events");
  if (!permissions.preview || !permissions.export) return NextResponse.json({ error: "Export permission required." }, { status: 403 });
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return NextResponse.json({ error: "JSON required." }, { status: 415 });
  try {
    const body = await boundedCalendarExportBody(request);
    if (body === null) return NextResponse.json({ error: "Export is too large." }, { status: 413 });
    let value: unknown;
    try { value = JSON.parse(body); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
    if (!isCalendarWordExportPayload(value)) return NextResponse.json({ error: "Invalid calendar export." }, { status: 400 });
    const document = await packCalendarWordDocument(value);
    return new NextResponse(new Uint8Array(document), { headers: {
      "Content-Disposition": `attachment; filename="FPCLA-${value.year}-calendar.docx"`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Cache-Control": "no-store",
    } });
  } catch { return NextResponse.json({ error: "Unable to export Word document." }, { status: 500 }); }
}
