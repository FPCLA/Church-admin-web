"use client";

type PermissionRowBulkActionsProps = {
  mode: "checkbox" | "triState";
  selectLabel: string;
  clearLabel: string;
};

export function PermissionRowBulkActions({
  mode,
  selectLabel,
  clearLabel,
}: PermissionRowBulkActionsProps) {
  function updateRow(button: HTMLButtonElement, selected: boolean) {
    const row = button.closest("tr");

    if (!row) {
      return;
    }

    if (mode === "checkbox") {
      row
        .querySelectorAll<HTMLInputElement>("input[data-permission-control]")
        .forEach((input) => {
          input.checked = selected;
        });
      return;
    }

    row
      .querySelectorAll<HTMLSelectElement>("select[data-permission-control]")
      .forEach((select) => {
        select.value = selected ? "allow" : "inherit";
      });
  }

  return (
    <div className="flex min-w-28 flex-wrap gap-2">
      <button
        className="rounded border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-medium text-sky-800 hover:bg-sky-100"
        onClick={(event) => updateRow(event.currentTarget, true)}
        type="button"
      >
        {selectLabel}
      </button>
      <button
        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        onClick={(event) => updateRow(event.currentTarget, false)}
        type="button"
      >
        {clearLabel}
      </button>
    </div>
  );
}
