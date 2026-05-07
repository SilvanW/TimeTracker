import { useEffect, useState, useMemo, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";

type CalendarWeekProps = {
  year: number;
  calendar_week: number;
  onYearChange: (value: number) => void;
  onCalendarWeekChange?: (value: number) => void;
};

export function CalendarWeekTable({
  year,
  calendar_week,
  onYearChange,
  onCalendarWeekChange,
}: CalendarWeekProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [view, setView] = useState<"calendar_week" | "day_of_year">(
    "calendar_week",
  );
  const [debouncedYear, setDebouncedYear] = useState<number>(year);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const WEEKLY_TARGET = 43;
  const DAILY_TARGET = WEEKLY_TARGET / 5;

  useEffect(() => {
    setLoading(true);
    setError(null);
    let url =
      view === "calendar_week"
        ? "https://localhost/api/time/calendar_week"
        : "https://localhost/api/time/day_of_year";
    if (debouncedYear > 0) {
      url += `?year=${debouncedYear}`;
    }
    console.log(`Fetching data from: ${url}`);
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch data");
        setLoading(false);
      });
  }, [view, debouncedYear]);

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

    // Add Target Reached column after total_time (or at end if not found)
    const totalTimeIdx = keys.indexOf("total_time");
    const insertIdx = totalTimeIdx >= 0 ? totalTimeIdx + 1 : baseColumns.length;

    const targetReachedCol: ColumnDef<any> = {
      id: "target_reached",
      header: "Target Reached",
      cell: (info: any) => {
        const row = info.row.original;
        const value = Number(row?.total_time);
        const isWeekly = view === "calendar_week";
        const target = isWeekly ? WEEKLY_TARGET : DAILY_TARGET;
        const reached = value >= target;
        return (
          <span
            className={`px-3 py-1 rounded font-semibold text-white ${
              reached ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {reached ? "Yes" : "No"}
          </span>
        );
      },
    };

    const diffCol: ColumnDef<any> = {
      id: "time_diff",
      header: "Difference",
      cell: (info: any) => {
        const row = info.row.original;
        const value = Number(row?.total_time);
        const isWeekly = view === "calendar_week";
        const target = isWeekly ? WEEKLY_TARGET : DAILY_TARGET;
        const diff = value - target;
        const positive = diff >= 0;
        return (
          <span
            className={`font-semibold ${positive ? "text-green-500" : "text-red-500"}`}
          >
            {positive ? "+" : ""}
            {diff.toFixed(2)}
          </span>
        );
      },
    };

    const cols = [...baseColumns];
    cols.splice(insertIdx, 0, targetReachedCol, diffCol);
    return cols;
  }, [data, view]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleRowClick = (row: any) => {
    onYearChange(row.year);
    onCalendarWeekChange(row.calendar_week);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!Array.isArray(data) || data.length === 0)
    return (
      <div className="w-full max-w-4xl mx-auto mt-1 px-2">
        <div className="p-8 text-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 text-lg font-medium shadow">
          No data found.
        </div>
      </div>
    );

  return (
    <div className="w-full max-w-4xl mx-auto mt-1 px-2">
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="view-select" className="font-medium text-zinc-700">
            View:
          </label>
          <select
            id="view-select"
            value={view}
            onChange={(e) =>
              setView(e.target.value as "calendar_week" | "day_of_year")
            }
            className="border border-zinc-300 rounded px-3 py-1 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="calendar_week">Calendar Week</option>
            <option value="day_of_year">Day of Year</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="year-input" className="font-medium text-zinc-700">
            Year:
          </label>
          <input
            id="year-input"
            type="number"
            min="0"
            placeholder="(all)"
            value={year}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || (/^\d+$/.test(val) && Number(val) >= 0)) {
                onChange(Number(val));
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setDebouncedYear(year);
              }
            }}
            className="border border-zinc-300 rounded px-3 py-1 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-200 w-28"
          />
        </div>
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
                  <th
                    key={header.id}
                    className="px-6 py-3 border-b border-zinc-200 text-left font-bold text-zinc-700 cursor-pointer select-none transition bg-zinc-100 hover:bg-zinc-200"
                    onClick={
                      header.column.getCanSort()
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {{
                      asc: <span className="ml-2 text-xs">▲</span>,
                      desc: <span className="ml-2 text-xs">▼</span>,
                    }[header.column.getIsSorted() as string] ?? null}
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
