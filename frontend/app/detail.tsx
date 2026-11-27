"use client";

import Link from "next/link";
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

type ProjectTime = {
  project_name: string;
  total_time: number;
};

const columnHelper = createColumnHelper<ProjectTime>();

const columns = [
  columnHelper.accessor("project_name", {
    header: () => "Project Name",
    cell: (info) => (
      <Link
        href={`/projects?project=${encodeURIComponent(info.getValue())}`}
        className="inline-block rounded bg-blue-50 border border-blue-200 px-3 py-1 font-medium text-blue-700 transition hover:bg-blue-100"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("total_time", {
    header: () => "Total Time",
    cell: (info) => {
      const value = Number(info.getValue());
      return isNaN(value) ? "" : value.toFixed(2);
    },
  }),
];

type DetailProps = {
  year: number;
  calendarWeek: number;
};

export function Detail({ year, calendarWeek }: DetailProps) {
  const [data, setData] = useState<ProjectTime[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [debouncedParams, setDebouncedParams] = useState({
    year,
    calendarWeek,
  });
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedParams((prev) =>
        prev.year === year && prev.calendarWeek === calendarWeek
          ? prev
          : { year, calendarWeek },
      );
    }, 500);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [year, calendarWeek]);

  useEffect(() => {
    setError(null);
    apiFetch<ProjectTime[]>(
      `/time/project?calendar_week=${debouncedParams.calendarWeek}&year=${debouncedParams.year}`,
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
