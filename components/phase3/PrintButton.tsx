"use client";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
      onClick={() => window.print()}
      type="button"
    >
      {label}
    </button>
  );
}
