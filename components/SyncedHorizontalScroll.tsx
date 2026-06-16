"use client";

import { type ReactNode, useRef } from "react";

export function SyncedHorizontalScroll({
  children,
  contentWidthClassName,
}: {
  children: ReactNode;
  contentWidthClassName: string;
}) {
  const topScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  function syncScroll(source: HTMLDivElement, target: HTMLDivElement | null) {
    if (!target || isSyncingRef.current) {
      return;
    }

    isSyncingRef.current = true;
    target.scrollLeft = source.scrollLeft;
    window.requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div
        ref={topScrollRef}
        className="overflow-x-auto border-b border-slate-200"
        onScroll={(event) => syncScroll(event.currentTarget, contentScrollRef.current)}
      >
        <div className={`h-4 ${contentWidthClassName}`} />
      </div>
      <div
        ref={contentScrollRef}
        className="overflow-x-auto"
        onScroll={(event) => syncScroll(event.currentTarget, topScrollRef.current)}
      >
        {children}
      </div>
    </div>
  );
}
