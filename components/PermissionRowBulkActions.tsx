"use client";

import { useEffect, useRef } from "react";

type PermissionRowBulkActionsProps = {
  mode: "checkbox" | "triState";
  selectLabel: string;
  clearLabel?: string;
};

export function PermissionRowBulkActions({
  mode,
  selectLabel,
}: PermissionRowBulkActionsProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function getRowControls() {
    const row = inputRef.current?.closest("tr");

    if (!row) {
      return [];
    }

    return Array.from(
      row.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
        "[data-permission-control]",
      ),
    );
  }

  function syncState() {
    const input = inputRef.current;
    const controls = getRowControls();

    if (!input || controls.length === 0) {
      return;
    }

    if (mode === "checkbox") {
      const checkboxes = controls.filter(
        (control): control is HTMLInputElement => control instanceof HTMLInputElement,
      );
      const checkedCount = checkboxes.filter((control) => control.checked).length;
      input.checked = checkedCount === checkboxes.length;
      input.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
      return;
    }

    const selects = controls.filter(
      (control): control is HTMLSelectElement => control instanceof HTMLSelectElement,
    );
    const allowCount = selects.filter((control) => control.value === "allow").length;
    input.checked = allowCount === selects.length;
    input.indeterminate = allowCount > 0 && allowCount < selects.length;
  }

  function updateRow(selected: boolean) {
    getRowControls().forEach((control) => {
      if (control instanceof HTMLInputElement) {
        control.checked = selected;
      } else {
        control.value = selected ? "allow" : "inherit";
      }
    });
    syncState();
  }

  useEffect(() => {
    const controls = getRowControls();
    controls.forEach((control) => {
      control.addEventListener("change", syncState);
    });
    syncState();

    return () => {
      controls.forEach((control) => {
        control.removeEventListener("change", syncState);
      });
    };
  });

  return (
    <label className="inline-flex items-center gap-2 rounded border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-medium text-sky-800">
      <input
        ref={inputRef}
        className="h-4 w-4"
        onChange={(event) => updateRow(event.currentTarget.checked)}
        type="checkbox"
      />
      <span>{selectLabel}</span>
    </label>
  );
}
