import { CalendarBuilderClient } from "./CalendarBuilderClient";
import { CalendarYearControls } from "./CalendarYearControls";
import { Phase3Layout, Phase3Nav } from "@/components/phase3/Phase3Layout";
import { PrintButton } from "@/components/phase3/PrintButton";
import { buildAnnualCalendar } from "@/lib/phase3/calendar-builder";
import { phase3Text } from "@/lib/phase3/config";
import { requireModuleContext } from "@/lib/calendar-access";
import { getAnnualCalendar } from "@/lib/annual-calendars-data";
import { hasRecordPermission } from "@/lib/permissions";

type PageProps = {
  searchParams?: Promise<{ rebuild?: string; year?: string }>;
};

export default async function CalendarBuilderPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const { user, profile, permissions } = await requireModuleContext("calendar_events");
  const p3 = phase3Text(profile.language_preference);
  const currentYear = new Date().getFullYear();
  const selectedYear = normalizeYear(params.year, currentYear + 1);
  const annualCalendar = buildAnnualCalendar(selectedYear);
  const savedCalendar = await getAnnualCalendar(selectedYear);
  const canEdit = savedCalendar
    ? await hasRecordPermission(user.id, "calendar_events", savedCalendar.id, "edit")
    : permissions.create;
  const isEnglish = profile.language_preference === "en";
  const yearOptions = Array.from({ length: 9 }, (_, index) => currentYear - 2 + index);

  return (
    <Phase3Layout locale={profile.language_preference} moduleName="calendar_events">
      <Phase3Nav
        backHref="/calendar"
        backLabel={p3.text("back")}
        locale={profile.language_preference}
      />

      <section className="rounded-lg border border-slate-200 bg-white p-4 print:hidden">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <CalendarYearControls
            isEnglish={isEnglish}
            hasSavedCalendar={Boolean(savedCalendar)}
            selectedYear={selectedYear}
            yearOptions={yearOptions}
          />
          <PrintButton label={isEnglish ? "Print" : "\u5217\u5370"} />
        </div>
      </section>

      <CalendarBuilderClient
        draftOwnerId={user.id}
        annualCalendar={annualCalendar}
        initialCalendar={savedCalendar}
        isEnglish={isEnglish}
        key={selectedYear}
        readOnly={!canEdit}
        startBlank={params.rebuild === "1"}
      />
    </Phase3Layout>
  );
}

function normalizeYear(rawYear: string | undefined, fallback: number) {
  const year = Number(rawYear);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return fallback;
  }

  return year;
}

