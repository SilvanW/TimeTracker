"use client";

import { flexRender, type Header } from "@tanstack/react-table";
import { cn } from "../lib/cn";

// Sortable table header cell. The arrow indicator always renders in a
// fixed-width box (dim "↕" when unsorted) so the column width — and thus
// the table layout — never shifts when toggling sort.
export function SortableHeader({
  header,
  alignRight = false,
}: {
  header: Header<any, any>;
  alignRight?: boolean;
}) {
  const { column } = header;
  const canSort = column.getCanSort();
  const sorted = column.getIsSorted();

  return (
    <th
      scope="col"
      onClick={canSort ? column.getToggleSortingHandler() : undefined}
      className={cn(
        "sticky top-0 z-10 border-b border-line bg-surface-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-3 transition-colors",
        alignRight ? "text-right" : "text-left",
        canSort && "cursor-pointer select-none hover:text-ink",
      )}
    >
      <span className="inline-flex items-center gap-1">
        {header.isPlaceholder
          ? null
          : flexRender(column.columnDef.header, header.getContext())}
        {canSort && (
          <span
            aria-hidden
            className={cn(
              "inline-block w-3 text-center text-[10px] leading-none",
              sorted ? "text-ink" : "text-ink-3/60",
            )}
          >
            {sorted === "asc" ? "↑" : sorted === "desc" ? "↓" : "↕"}
          </span>
        )}
      </span>
    </th>
  );
}
