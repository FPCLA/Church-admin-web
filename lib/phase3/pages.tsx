import { redirect } from "next/navigation";
import Link from "next/link";
import { BulletinEditor } from "@/components/phase3/BulletinEditor";
import { CalendarHistoryPreview } from "@/app/calendar/CalendarHistoryPreview";
import { Phase3Form } from "@/components/phase3/Phase3Form";
import { Phase3Layout, Phase3Nav } from "@/components/phase3/Phase3Layout";
import { Phase3List } from "@/components/phase3/Phase3List";
import { autoFillBulletin, buildBulletinDefaults, openDatedModule } from "@/app/actions/phase3";
import {
  phase3ModuleMap,
  phase3Text,
  type Phase3ModuleName,
} from "@/lib/phase3/config";
import {
  getBulletinForDate,
  getLookupData,
  getModuleRows,
  getRecord,
  getRowsByDate,
  requireModuleContext,
} from "@/lib/phase3/data";

export async function ModuleListPage({
  moduleName,
  status,
}: {
  moduleName: Phase3ModuleName;
  status?: string;
}) {
  const config = phase3ModuleMap[moduleName];
  const { profile, permissions } = await requireModuleContext(moduleName);
  const [rows, lookup] = await Promise.all([getModuleRows(config), getLookupData()]);
  const p3 = phase3Text(profile.language_preference);

  return (
    <Phase3Layout locale={profile.language_preference} moduleName={moduleName}>
      <Phase3Nav
        locale={profile.language_preference}
        status={status ? p3.text("saved") : undefined}
        backLabel={p3.text("back")}
      />
      {config.detailsByDate && permissions.create && (
        <form action={openDatedModule} className="rounded-lg border border-slate-200 bg-white p-4">
          <input name="module_name" type="hidden" value={moduleName} />
          <label className="grid max-w-xs gap-1 text-sm">
            {p3.field(config.dateField || "date")}
            <input
              className="rounded border border-slate-300 px-3 py-2"
              defaultValue={new Date().toISOString().slice(0, 10)}
              name="date"
              type="date"
            />
          </label>
          <button className="mt-3 rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white">
            {p3.text("add")}
          </button>
        </form>
      )}
      {moduleName === "calendar_events" && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                {profile.language_preference === "en" ? "Calendar - New/Edit" : "行事曆-新建/編輯"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {profile.language_preference === "en"
                  ? "Choose a year and auto-generate Sundays and major church calendar dates."
                  : "開始建立教會年度行事曆，自動產生全年主日與主要節期日期。"}
              </p>
            </div>
            <Link className="rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white" href="/calendar/builder">
              {profile.language_preference === "en" ? "New/Edit" : "新建/編輯"}
            </Link>
          </div>
        </section>
      )}
      {moduleName === "calendar_events" ? (
        <CalendarHistoryPreview isEnglish={profile.language_preference === "en"} />
      ) : (
        <Phase3List
          config={config}
          locale={profile.language_preference}
          lookup={lookup}
          permissions={permissions}
          rows={rows}
        />
      )}
    </Phase3Layout>
  );
}

export async function ModuleNewPage({ moduleName }: { moduleName: Phase3ModuleName }) {
  const config = phase3ModuleMap[moduleName];
  const { profile, permissions } = await requireModuleContext(moduleName);

  if (!permissions.create) {
    redirect(`${config.basePath}?status=unauthorized`);
  }

  const lookup = await getLookupData();
  const p3 = phase3Text(profile.language_preference);

  return (
    <Phase3Layout locale={profile.language_preference} moduleName={moduleName}>
      <Phase3Nav
        backHref={config.basePath}
        backLabel={p3.text("back")}
        locale={profile.language_preference}
      />
      <Phase3Form
        canDelete={false}
        canEdit={true}
        config={config}
        locale={profile.language_preference}
        lookup={lookup}
        mode="create"
      />
    </Phase3Layout>
  );
}

export async function ModuleDetailPage({
  id,
  moduleName,
  status,
}: {
  id: string;
  moduleName: Phase3ModuleName;
  status?: string;
}) {
  const config = phase3ModuleMap[moduleName];
  const { profile, permissions } = await requireModuleContext(moduleName);
  const [record, lookup] = await Promise.all([getRecord(config, id), getLookupData()]);
  const p3 = phase3Text(profile.language_preference);

  if (!record) {
    redirect(config.basePath);
  }

  return (
    <Phase3Layout locale={profile.language_preference} moduleName={moduleName}>
      <Phase3Nav
        backHref={config.basePath}
        backLabel={p3.text("back")}
        locale={profile.language_preference}
        status={status ? p3.text("saved") : undefined}
      />
      <Phase3Form
        canDelete={permissions.delete}
        canEdit={permissions.edit}
        config={config}
        locale={profile.language_preference}
        lookup={lookup}
        mode="edit"
        record={record}
      />
    </Phase3Layout>
  );
}

export async function ServiceRolesPage({ status }: { status?: string }) {
  const moduleName = "service_roles";
  const config = phase3ModuleMap[moduleName];
  const { profile, permissions } = await requireModuleContext(moduleName);
  const [rows, lookup] = await Promise.all([getModuleRows(config), getLookupData()]);
  const p3 = phase3Text(profile.language_preference);

  return (
    <Phase3Layout locale={profile.language_preference} moduleName={moduleName}>
      <Phase3Nav
        locale={profile.language_preference}
        status={status ? p3.text("saved") : undefined}
        backLabel={p3.text("back")}
      />
      {permissions.create && (
        <Phase3Form
          canDelete={false}
          canEdit={true}
          config={config}
          locale={profile.language_preference}
          lookup={lookup}
          mode="create"
          record={{ active: true }}
        />
      )}
      <Phase3List
        config={config}
        locale={profile.language_preference}
        lookup={lookup}
        permissions={permissions}
        rows={rows}
      />
      {rows.map((record) => (
        <Phase3Form
          canDelete={permissions.delete}
          canEdit={permissions.edit}
          config={config}
          key={String(record.id)}
          locale={profile.language_preference}
          lookup={lookup}
          mode="edit"
          record={record}
        />
      ))}
    </Phase3Layout>
  );
}

export async function ServiceAssignmentsDatePage({
  date,
  status,
}: {
  date: string;
  status?: string;
}) {
  const moduleName = "service_assignments";
  const config = phase3ModuleMap[moduleName];
  const { profile, permissions } = await requireModuleContext(moduleName);
  const [rows, lookup] = await Promise.all([getRowsByDate(config, date), getLookupData()]);
  const p3 = phase3Text(profile.language_preference);

  return (
    <Phase3Layout locale={profile.language_preference} moduleName={moduleName}>
      <Phase3Nav
        backHref={config.basePath}
        backLabel={p3.text("back")}
        locale={profile.language_preference}
        status={status ? p3.text("saved") : undefined}
      />
      {permissions.create && (
        <Phase3Form
          canDelete={false}
          canEdit={true}
          config={config}
          locale={profile.language_preference}
          lookup={lookup}
          mode="create"
          record={{ service_date: date }}
        />
      )}
      {rows.map((record) => (
        <Phase3Form
          canDelete={permissions.delete}
          canEdit={permissions.edit}
          config={config}
          key={String(record.id)}
          locale={profile.language_preference}
          lookup={lookup}
          mode="edit"
          record={record}
        />
      ))}
    </Phase3Layout>
  );
}

export async function BulletinDatePage({
  auto,
  date,
  status,
}: {
  auto?: string;
  date: string;
  status?: string;
}) {
  const moduleName = "bulletins";
  const config = phase3ModuleMap[moduleName];
  const { profile, permissions } = await requireModuleContext(moduleName);
  const [existing, lookup] = await Promise.all([getBulletinForDate(date), getLookupData()]);
  const defaults = auto === "1" || !existing ? await buildBulletinDefaults(date, existing) : existing;
  const p3 = phase3Text(profile.language_preference);
  const mode = existing ? "edit" : "create";

  if (mode === "create" && !permissions.create) {
    redirect(config.basePath);
  }

  return (
    <Phase3Layout locale={profile.language_preference} moduleName={moduleName}>
      <Phase3Nav
        backHref={config.basePath}
        backLabel={p3.text("back")}
        locale={profile.language_preference}
        status={status ? p3.text("saved") : undefined}
      />
      <form action={autoFillBulletin} className="rounded-lg border border-slate-200 bg-white p-4">
        <label className="grid max-w-xs gap-1 text-sm">
          {p3.field("bulletin_date")}
          <input
            className="rounded border border-slate-300 px-3 py-2"
            defaultValue={date}
            name="bulletin_date"
            type="date"
          />
        </label>
        <button className="mt-3 rounded border border-sky-300 px-4 py-2 text-sm font-medium text-sky-700">
          {p3.text("autoFill")}
        </button>
      </form>
      <BulletinEditor
        canEdit={permissions.edit}
        config={config}
        locale={profile.language_preference}
        lookup={lookup}
        mode={mode}
        record={defaults}
      />
    </Phase3Layout>
  );
}
