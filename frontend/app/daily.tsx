"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "./lib/api";
import { SortableHeader } from "./components/sortable-header";
import {
  dayTargetHours,
  fetchWorkingHoursTargets,
  type WorkingHoursTarget,
} from "./lib/targets";

type DayTime = {
  year: number;
  day_of_year: number;
  total_time: number;
};

const columnHelper = createColumnHelper<DayTime>();

// 1-based calendar day-of-year values (PostgreSQL EXTRACT(DOY FROM ...))
// that ISO week `week` of ISO year `year` occupies within calendar year `year`.
// Jan 4 is always in ISO week 1, so anchor the week on it.
function dayOfYearsOfIsoWeek(year: number, week: number): number[] {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayNum = jan4.getUTCDay() || 7; // Mon=1 .. Sun=7
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (dayNum - 1) + (week - 1) * 7);
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const days: number[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    if (d.getUTCFullYear() === year) {
      days.push(
        Math.floor((d.getTime() - startOfYear.getTime()) / 86400000) + 1,
      );
    }
  }
  return days;
}

export function WeekDays({
  year,
  calendarWeek,
  selectedDay,
  onDaySelect,
}: {
  year: number;
  calendarWeek: number;
  selectedDay: number;
  onDaySelect: (dayOfYear: number) => void;
}) {
  const [data, setData] = useState<DayTime[]>([]);
  const [targets, setTargets] = useState<WorkingHoursTarget[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [debouncedParams, setDebouncedParams] = useState({
    year,
    calendarWeek,
  });
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchWorkingHoursTargets()
      .then(setTargets)
      .catch(() => {});
  }, []);

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
    if (debouncedParams.year <= 0) {
      setData([]);
      return;
    }
    apiFetch<DayTime[]>(`/time/day_of_year?year=${debouncedParams.year}`)
      .then((json) => setData(json))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to fetch data"),
      );
  }, [debouncedParams]);

  const rows = useMemo(() => {
    if (debouncedParams.year <= 0 || debouncedParams.calendarWeek < 1)
      return [];
    const days = dayOfYearsOfIsoWeek(
      debouncedParams.year,
      debouncedParams.calendarWeek,
    );
    const daySet = new Set(days);
    return data
      .filter(
        (row) =>
          row.year === debouncedParams.year && daySet.has(row.day_of_year),
      )
      .sort((a, b) => a.day_of_year - b.day_of_year);
  }, [data, debouncedParams]);

  const columns = useMemo<ColumnDef<DayTime, any>[]>(
    () => [
      columnHelper.accessor("day_of_year", {
        header: () => "Date",
        cell: (info) => {
          const row = info.row.original;
          const date = new Date(Date.UTC(row.year, 0, row.day_of_year - 1));
          return date.toISOString().slice(0, 10);
        },
      }),
      columnHelper.accessor("total_time", {
        header: () => "Total Time",
        cell: (info) => {
          const value = Number(info.getValue());
          return isNaN(value) ? "" : value.toFixed(2);
        },
      }),
      {
        id: "time_diff",
        accessorFn: (row) => {
          const target = dayTargetHours(targets, row.year, row.day_of_year);
          return target === null ? null : Number(row.total_time) - target;
        },
        header: "Difference",
        cell: (info) => {
          const row = info.row.original;
          const target = dayTargetHours(targets, row.year, row.day_of_year);
          if (target === null) return "—";
          const diff = Number(row.total_time) - target;
          const positive = diff >= 0;
          return (
            <span
              className={`px-3 py-1 rounded font-semibold text-white ${
                positive ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {positive ? "+" : ""}
              {diff.toFixed(2)}
            </span>
          );
        },
      },
    ],
    [targets],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full">
      <div
        className="overflow-x-auto overflow-y-auto rounded-lg shadow border border-zinc-200 bg-white"
        style={{ maxHeight: "60vh" }}
      >
        {error ? (
          <div className="p-8 text-center rounded-lg border border-red-200 bg-red-50 text-red-700 text-lg font-medium">
            {error}
          </div>
        ) : rows.length === 0 ? (
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
                  className={`transition ${
                    row.original.day_of_year === selectedDay
                      ? "bg-blue-100"
                      : Number(row.id) % 2 === 0
                        ? "bg-white"
                        : "bg-zinc-50"
                  } hover:bg-blue-100/40`}
                  onClick={() => onDaySelect(row.original.day_of_year)}
                  style={{ cursor: "pointer" }}
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
