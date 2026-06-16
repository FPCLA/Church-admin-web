import {
  createPhase3Record,
  deletePhase3Record,
  updatePhase3Record,
} from "@/app/actions/phase3";
import { FieldControl } from "@/components/phase3/FieldControl";
import {
  phase3Text,
  type Phase3ModuleConfig,
} from "@/lib/phase3/config";
import type { LookupData } from "@/lib/phase3/data";

export function Phase3Form({
  canDelete,
  canEdit,
  config,
  locale,
  lookup,
  mode,
  record,
}: {
  canDelete: boolean;
  canEdit: boolean;
  config: Phase3ModuleConfig;
  locale?: string | null;
  lookup: LookupData;
  mode: "create" | "edit";
  record?: Record<string, unknown> | null;
}) {
  const p3 = phase3Text(locale);
  const action = mode === "create" ? createPhase3Record : updatePhase3Record;
  const writable = canEdit || mode === "create";
  const recordId = record?.id ? String(record.id) : "";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      {!writable && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {p3.text("readOnly")}
        </div>
      )}
      <form action={action} className="grid gap-4 md:grid-cols-2">
        <input name="module_name" type="hidden" value={config.moduleName} />
        {recordId && <input name="id" type="hidden" value={recordId} />}
        {config.formFields.map((field) => (
          <FieldControl
            disabled={!writable}
            field={field}
            key={field.name}
            label={p3.field(field.name)}
            locale={locale}
            lookup={lookup}
            value={record?.[field.name]}
          />
        ))}
        {writable && (
          <div className="md:col-span-2">
            <button className="rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white">
              {mode === "create" ? p3.text("create") : p3.text("save")}
            </button>
          </div>
        )}
      </form>

      {mode === "edit" && canDelete && recordId && (
        <form action={deletePhase3Record} className="mt-6 border-t border-slate-200 pt-4">
          <input name="module_name" type="hidden" value={config.moduleName} />
          <input name="id" type="hidden" value={recordId} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input name="confirm_delete" type="checkbox" /> {p3.text("deleteConfirm")}
          </label>
          <button className="mt-3 rounded border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700">
            {p3.text("delete")}
          </button>
        </form>
      )}
    </section>
  );
}
