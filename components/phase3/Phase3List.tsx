import type { PermissionSet } from "@/lib/permissions";
import { phase3Text, type Phase3ModuleConfig } from "@/lib/phase3/config";
import type { LookupData } from "@/lib/phase3/data";

export function Phase3List({
  config,
  locale,
  lookup,
  permissions,
  rows,
}: {
  config: Phase3ModuleConfig;
  locale?: string | null;
  lookup: LookupData;
  permissions: PermissionSet;
  rows: Array<Record<string, unknown>>;
}) {
  const p3 = phase3Text(locale);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{p3.text("list")}</h2>
        {permissions.create && config.newPath && (
          <a className="rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white" href={config.newPath}>
            {p3.text("add")}
          </a>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{p3.text("noData")}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-700">
              <tr>
                {config.listFields.map((field) => (
                  <th className="p-2 font-medium" key={field}>
                    {p3.field(field)}
                  </th>
                ))}
                <th className="p-2 font-medium">{p3.text("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-t border-slate-200" key={String(row.id)}>
                  {config.listFields.map((field) => (
                    <td className="p-2 align-top" key={field}>
                      {formatCell(field, row[field], lookup, locale)}
                    </td>
                  ))}
                  <td className="p-2 align-top">
                    <a
                      className="text-sky-700"
                      href={detailHref(config, row)}
                    >
                      {permissions.edit ? p3.text("edit") : p3.text("preview")}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function formatCell(
  field: string,
  value: unknown,
  lookup: LookupData,
  locale?: string | null,
) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (field === "service_role_id") {
    const role = lookup.serviceRoles.find((item) => item.id === value);
    return locale === "en"
      ? role?.display_name_en || String(value)
      : role?.display_name_zh || role?.display_name_en || String(value);
  }

  if (field === "speaker_id") {
    return lookup.speakers.find((item) => item.id === value)?.name || String(value);
  }

  if (field === "calendar_event_id") {
    const event = lookup.events.find((item) => item.id === value);
    return event ? `${event.event_date || ""} ${event.title || ""}`.trim() : String(value);
  }

  if (field === "active") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function detailHref(config: Phase3ModuleConfig, row: Record<string, unknown>) {
  if (config.moduleName === "service_assignments") {
    return `${config.basePath}/${row.service_date}`;
  }

  if (config.moduleName === "bulletins") {
    return `${config.basePath}/${row.bulletin_date}`;
  }

  if (config.moduleName === "service_roles") {
    return config.basePath;
  }

  return `${config.basePath}/${row.id}`;
}
