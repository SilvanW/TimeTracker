import { useEffect, useState, useMemo, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { apiFetch } from "./lib/api";
import { YearFilter } from "./components/input";
import { SortableHeader } from "./components/sortable-header";

type CalendarWeekProps = {
  year: number;
  calendarWeek: number;
  onYearChange: (value: number) => void;
  onCalendarWeekChange: (value: number) => void;
};

export function CalendarWeekTable({
  year,
  calendarWeek,
  onYearChange,
  onCalendarWeekChange,
}: CalendarWeekProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [debouncedYear, setDebouncedYear] = useState<number>(year);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const WEEKLY_TARGET = 43;

  useEffect(() => {
    setLoading(true);
    setError(null);
    const url =
      debouncedYear > 0
        ? `/time/calendar_week?year=${debouncedYear}`
        : "/time/calendar_week";
    apiFetch<any[]>(url)
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        setLoading(false);
      });
  }, [debouncedYear]);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedYear(year);
    }, 500);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [year]);

  // Always define columns, even if data is empty
  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (!data || data.length === 0) return [];
    const keys = Object.keys(data[0]);
    const baseColumns = keys.map((key) => {
      if (key === "total_time") {
        return {
          accessorKey: key,
          header: key,
          cell: (info: any) => {
            const value = Number(info.getValue());
            return isNaN(value) ? "" : value.toFixed(2);
          },
        } as ColumnDef<any>;
      }
      return {
        accessorKey: key,
        header: key,
        cell: (info: any) => info.getValue(),
      } as ColumnDef<any>;
    });

    // Add Difference column after total_time (or at end if not found)
    const totalTimeIdx = keys.indexOf("total_time");
    const insertIdx = totalTimeIdx >= 0 ? totalTimeIdx + 1 : baseColumns.length;

    const diffCol: ColumnDef<any> = {
      id: "time_diff",
      accessorFn: (row: any) => Number(row?.total_time) - WEEKLY_TARGET,
      header: "Difference",
      cell: (info: any) => {
        const row = info.row.original;
        const value = Number(row?.total_time);
        const target = WEEKLY_TARGET;
        const diff = value - target;
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
    };

    const cols = [...baseColumns];
    cols.splice(insertIdx, 0, diffCol);
    return cols;
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleRowClick = (row: any) => {
    // row is a TanStack Row model — the actual data lives on row.original
    const original = row.original;
    onYearChange(original.year);
    onCalendarWeekChange(original.calendar_week);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!Array.isArray(data) || data.length === 0)
    return (
      <div className="w-full mt-1 px-2">
        <div className="p-8 text-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 text-lg font-medium shadow">
          No data found.
        </div>
      </div>
    );

  return (
    <div className="w-full mt-1 px-2">
      <div className="mb-4 flex items-center gap-4">
        <YearFilter
          value={year}
          onChange={onYearChange}
          onEnter={() => setDebouncedYear(year)}
        />
      </div>
      <div
        className="overflow-x-auto overflow-y-auto rounded-lg shadow border border-zinc-200 bg-white"
        style={{ maxHeight: "60vh" }}
      >
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
                  row.original.year === year &&
                  row.original.calendar_week === calendarWeek
                    ? "bg-blue-100"
                    : Number(row.id) % 2 === 0
                      ? "bg-white"
                      : "bg-zinc-50"
                } hover:bg-blue-100/40`}
                onClick={() => handleRowClick(row)}
                style={{ cursor: "pointer" }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-3 border-b border-zinc-100"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
