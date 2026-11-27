"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "./lib/api";
import { SortableHeader } from "./components/sortable-header";

type TimeEntry = {
  id: number;
  project_id: number;
  start: string;
  end: string;
  description: string | null;
  total_time: number;
};

const columnHelper = createColumnHelper<TimeEntry>();

const columns = [
  columnHelper.accessor("start", {
    header: () => "Start",
    cell: (info) => formatTime(info.getValue()),
  }),
  columnHelper.accessor("end", {
    header: () => "End",
    cell: (info) => formatTime(info.getValue()),
  }),
  columnHelper.accessor("total_time", {
    header: () => "Time Worked",
    cell: (info) => {
      const value = Number(info.getValue());
      return isNaN(value) ? "" : value.toFixed(2);
    },
  }),
  columnHelper.accessor("description", {
    header: () => "Description",
    cell: (info) => {
      const value = info.getValue();
      return value === null || value === undefined ? "—" : value;
    },
  }),
];

// "2026-03-04T09:15:00" -> "09:15"
function formatTime(value: string): string {
  return value.slice(11, 16);
}

type DayDetailProps = {
  year: number;
  dayOfYear: number;
};

export function DayDetail({ year, dayOfYear }: DayDetailProps) {
  const [data, setData] = useState<TimeEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [debouncedParams, setDebouncedParams] = useState({ year, dayOfYear });
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedParams((prev) =>
        prev.year === year && prev.dayOfYear === dayOfYear
          ? prev
          : { year, dayOfYear },
      );
    }, 500);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [year, dayOfYear]);

  useEffect(() => {
    setError(null);
    apiFetch<TimeEntry[]>(
      `/time/day?year=${debouncedParams.year}&day_of_year=${debouncedParams.dayOfYear}`,
    )
      .then((json) => setData(json))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to fetch data"),
      );
  }, [debouncedParams]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full mt-1 px-2">
      <div
        className="overflow-x-auto overflow-y-auto rounded-lg shadow border border-zinc-200 bg-white"
        style={{ maxHeight: "60vh" }}
      >
        {error ? (
          <div className="p-8 text-center rounded-lg border border-red-200 bg-red-50 text-red-700 text-lg font-medium">
            {error}
          </div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 text-lg font-medium shadow">
            No data found.
          </div>
        ) : (
          <table className="w-full text-sm text-zinc-800">
            <thead className="bg-zinc-100 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <SortableHeader key={header.id} header={header} />
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={
                    Number(row.id) % 2 === 0 ? "bg-white" : "bg-zinc-50"
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-3 border-b border-zinc-100"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
