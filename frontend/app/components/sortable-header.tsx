"use client";

import { flexRender, type Header } from "@tanstack/react-table";

// Sortable table header cell. The arrow indicator always renders in a
// fixed-width box (dim "↕" when unsorted) so the column width — and thus
// the table layout — never shifts when toggling sort.
export function SortableHeader({ header }: { header: Header<any, any> }) {
  const { column } = header;
  const canSort = column.getCanSort();
  const sorted = column.getIsSorted();

  return (
    <th
      className={`px-6 py-3 border-b border-zinc-200 text-left font-bold text-zinc-700 transition bg-zinc-100 ${
        canSort ? "cursor-pointer select-none hover:bg-zinc-200" : ""
      }`}
      onClick={canSort ? column.getToggleSortingHandler() : undefined}
    >
      <span className="inline-flex items-center gap-1.5">
        {header.isPlaceholder
          ? null
          : flexRender(column.columnDef.header, header.getContext())}
        {canSort && (
          <span
            className={`inline-block w-3 text-center text-xs leading-none ${
              sorted ? "text-zinc-700" : "text-zinc-400"
            }`}
          >
            {sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : "↕"}
          </span>
        )}
      </span>
    </th>
  );
}
