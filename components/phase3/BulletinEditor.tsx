"use client";

import { useMemo, useState } from "react";
import {
  createPhase3Record,
  updatePhase3Record,
} from "@/app/actions/phase3";
import { FieldControl } from "@/components/phase3/FieldControl";
import {
  phase3Text,
  type Phase3ModuleConfig,
} from "@/lib/phase3/config";
import type { LookupData } from "@/lib/phase3/data";

export function BulletinEditor({
  canEdit,
  config,
  locale,
  lookup,
  mode,
  record,
}: {
  canEdit: boolean;
  config: Phase3ModuleConfig;
  locale?: string | null;
  lookup: LookupData;
  mode: "create" | "edit";
  record: Record<string, unknown>;
}) {
  const p3 = phase3Text(locale);
  const writable = canEdit || mode === "create";
  const recordId = record.id ? String(record.id) : "";
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      config.formFields.map((field) => [
        field.name,
        record[field.name] === null || record[field.name] === undefined
          ? ""
          : String(record[field.name]),
      ]),
    ),
  );
  const action = mode === "create" ? createPhase3Record : updatePhase3Record;
  const previewBlocks = useMemo(
    () =>
      [
        ["opening_text", values.opening_text],
        ["sunday_school_text", values.sunday_school_text],
        ["worship_text", values.worship_text],
        ["announcements", values.announcements],
        ["prayer_requests", values.prayer_requests],
        ["next_week_preview", values.next_week_preview],
        ["notes", values.notes],
      ] as const,
    [values],
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
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
            <div
              className={field.span === "full" ? "md:col-span-2" : ""}
              key={field.name}
              onChange={(event) => {
                const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
                setValues((current) => ({ ...current, [field.name]: target.value }));
              }}
            >
              <FieldControl
                disabled={!writable}
                field={field}
                label={p3.field(field.name)}
                locale={locale}
                lookup={lookup}
                value={values[field.name]}
              />
            </div>
          ))}
          {writable && (
            <div className="md:col-span-2">
              <button className="rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white">
                {mode === "create" ? p3.text("create") : p3.text("save")}
              </button>
            </div>
          )}
        </form>
      </section>
      <aside className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">{p3.text("preview")}</h2>
        <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
          <h3 className="text-xl font-semibold text-slate-950">
            {values.title || p3.module("bulletins")}
          </h3>
          <p className="text-slate-500">{values.bulletin_date}</p>
          {previewBlocks.map(([field, value]) => (
            <section className="border-t border-slate-100 pt-3" key={field}>
              <h4 className="font-semibold text-slate-900">{p3.field(field)}</h4>
              <p className="mt-1 whitespace-pre-wrap">{value || "-"}</p>
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}
