import { phase3Text, type Phase3Field } from "@/lib/phase3/config";
import type { LookupData } from "@/lib/phase3/data";

export function FieldControl({
  disabled,
  field,
  label,
  locale,
  lookup,
  value,
}: {
  disabled?: boolean;
  field: Phase3Field;
  label: string;
  locale?: string | null;
  lookup: LookupData;
  value: unknown;
}) {
  const p3 = phase3Text(locale);
  const commonClass = "rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100";
  const wrapperClass = field.span === "full" ? "grid gap-1 md:col-span-2" : "grid gap-1";
  const textValue = value === null || value === undefined ? "" : String(value);

  if (field.type === "textarea") {
    return (
      <label className={wrapperClass}>
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <textarea
          className={`${commonClass} min-h-28`}
          defaultValue={textValue}
          disabled={disabled}
          name={field.name}
          required={field.required}
        />
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className={wrapperClass}>
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <select
          className={commonClass}
          defaultValue={textValue}
          disabled={disabled}
          name={field.name}
          required={field.required}
        >
          <option value="">{p3.text("select")}</option>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "event") {
    return (
      <label className={wrapperClass}>
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <select className={commonClass} defaultValue={textValue} disabled={disabled} name={field.name}>
          <option value="">{p3.text("select")}</option>
          {lookup.events.map((event) => (
            <option key={event.id} value={event.id}>
              {[event.event_date, event.title].filter(Boolean).join(" / ")}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "speaker") {
    return (
      <label className={wrapperClass}>
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <select
          className={commonClass}
          defaultValue={textValue}
          disabled={disabled}
          name={field.name}
          required={field.required}
        >
          <option value="">{p3.text("select")}</option>
          {lookup.speakers.map((speaker) => (
            <option key={speaker.id} value={speaker.id}>
              {speaker.name}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "serviceRole") {
    return (
      <label className={wrapperClass}>
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <select
          className={commonClass}
          defaultValue={textValue}
          disabled={disabled}
          name={field.name}
          required={field.required}
        >
          <option value="">{p3.text("select")}</option>
          {lookup.serviceRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {locale === "en" ? role.display_name_en : role.display_name_zh}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input defaultChecked={Boolean(value)} disabled={disabled} name={field.name} type="checkbox" />
        {label}
      </label>
    );
  }

  return (
    <label className={wrapperClass}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className={commonClass}
        defaultValue={textValue}
        disabled={disabled}
        name={field.name}
        required={field.required}
        type={field.type}
      />
    </label>
  );
}
