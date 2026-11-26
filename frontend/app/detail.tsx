"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { Numeric } from "./components/input";
import { apiFetch } from "./lib/api";

type ProjectTime = {
  project_name: string;
  total_time: number;
};

const defaultData: ProjectTime[] = [];

const columnHelper = createColumnHelper<ProjectTime>();

const columns = [
  columnHelper.accessor("project_name", {
    header: () => "Project Name",
    cell: (info) => info.getValue(),
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
  onChange: (value: number) => void;
  onCalendarWeekChange: (value: number) => void;
};

export function Detail({
  year,
  calendarWeek,
  onChange,
  onCalendarWeekChange,
}: DetailProps) {
  const [data, setData] = useState(() => [...defaultData]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    apiFetch<ProjectTime[]>(
      `/time/project?calendar_week=${calendarWeek}&year=${year}`,
    )
      .then((json) => setData(json))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to fetch data"),
      );
  }, [calendarWeek, year]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full max-w-4xl mx-auto mt-1 px-2">
      <div className="flex items-center gap-2">
        <Numeric value={year} label="Year" onChange={onChange} />
        <Numeric
          value={calendarWeek}
          label="Calendar Week"
          min={1}
          onChange={onCalendarWeekChange}
        />
      </div>

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
                    <th
                      key={header.id}
                      className="px-6 py-3 border-b border-zinc-200 text-left font-bold text-zinc-700 transition bg-zinc-100"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`transition ${
                    Number(row.id) % 2 === 0 ? "bg-white" : "bg-zinc-50"
                  } hover:bg-blue-100/40`}
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
