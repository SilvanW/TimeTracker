"use client";

import {
  flexRender,
  type Row,
  type Table as TanStackTable,
} from "@tanstack/react-table";
import { cn } from "../../lib/cn";
import { SortableHeader } from "../sortable-header";
import { EmptyView, ErrorView, LoadingView } from "./state-view";

export type DataTableProps<TData> = {
  table: TanStackTable<TData>;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  // Max height of the scroll area; the header row stays sticky.
  maxHeight?: string;
  onRowClick?: (row: Row<TData>) => void;
  isRowSelected?: (row: Row<TData>) => boolean;
};

// The single table renderer for the whole app: sticky header, row borders,
// hover/selection states and the loading/error/empty states.
export function DataTable<TData>({
  table,
  loading = false,
  error = null,
  emptyMessage = "No data found.",
  maxHeight = "60vh",
  onRowClick,
  isRowSelected,
}: DataTableProps<TData>) {
  const rows = table.getRowModel().rows;
  const headerGroups = table.getHeaderGroups();

  // Columns whose header renders an empty string hold per-row actions. They
  // are right-aligned in the header and every row so actions consistently
  // sit at the right edge of the table.
  const actionColumnIds = new Set(
    headerGroups
      .flatMap((group) => group.headers)
      .filter(
        (header) =>
          flexRender(header.column.columnDef.header, header.getContext()) ===
          "",
      )
      .map((header) => header.column.id),
  );

  return (
    <div className="overflow-x-auto" style={{ maxHeight }}>
      {loading ? (
        <LoadingView />
      ) : error !== null ? (
        <ErrorView message={error} />
      ) : rows.length === 0 ? (
        <EmptyView message={emptyMessage} />
      ) : (
        <table className="w-full text-sm tabular-nums">
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <SortableHeader
                    key={header.id}
                    header={header}
                    alignRight={actionColumnIds.has(header.column.id)}
                  />
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "transition-colors",
                  onRowClick && "cursor-pointer hover:bg-surface-2",
                  isRowSelected?.(row) && "bg-row-selected",
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2.5 align-middle">
                    {actionColumnIds.has(cell.column.id) ? (
                      <div className="flex items-center justify-end gap-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </div>
                    ) : (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
