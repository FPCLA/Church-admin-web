import { CalendarBuilderClient } from "../builder/CalendarBuilderClient";
import { Phase3Layout, Phase3Nav } from "@/components/phase3/Phase3Layout";
import { buildAnnualCalendar } from "@/lib/phase3/calendar-builder";
import { phase3Text } from "@/lib/phase3/config";
import { requireModuleContext } from "@/lib/phase3/data";

type PageProps = {
  searchParams?: Promise<{ year?: string }>;
};

export default async function CalendarPreviewPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const { profile } = await requireModuleContext("calendar_events");
  const currentYear = new Date().getFullYear();
  const selectedYear = normalizeYear(params.year, currentYear);
  const annualCalendar = buildAnnualCalendar(selectedYear);
  const isEnglish = profile.language_preference === "en";
  const p3 = phase3Text(profile.language_preference);

  return (
    <Phase3Layout locale={profile.language_preference} moduleName="calendar_events">
      <Phase3Nav
        backHref="/calendar"
        backLabel={p3.text("back")}
        locale={profile.language_preference}
      />
      <CalendarBuilderClient
        annualCalendar={annualCalendar}
        isEnglish={isEnglish}
        key={selectedYear}
        readOnly
      />
    </Phase3Layout>
  );
}

function normalizeYear(rawYear: string | undefined, fallback: number) {
  const year = Number(rawYear);
  return Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : fallback;
}
