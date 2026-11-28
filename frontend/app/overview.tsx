import { useEffect, useState, useMemo, useRef, type ReactNode } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { apiFetch } from "./lib/api";
import { cn } from "./lib/cn";
import { YearFilter } from "./components/input";
import { Card, CardHeader } from "./components/ui/card";
import { DataTable } from "./components/ui/data-table";
import { formatHours, formatSigned } from "./lib/format";
import {
  fetchWorkingHoursTargets,
  weekTargetHours,
  type WorkingHoursTarget,
} from "./lib/targets";

// The backend returns exactly these 3 fields per calendar week.
type KWTime = { year: number; calendar_week: number; total_time: number };

type CalendarWeekProps = {
  year: number;
  calendarWeek: number;
  onYearChange: (value: number) => void;
  onCalendarWeekChange: (value: number) => void;
  onDefaultSelect?: (year: number, calendarWeek: number) => void;
  refreshKey: number;
};

export function CalendarWeekTable({
  year,
  calendarWeek,
  onYearChange,
  onCalendarWeekChange,
  onDefaultSelect,
  refreshKey,
}: CalendarWeekProps) {
  const [data, setData] = useState<KWTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [debouncedYear, setDebouncedYear] = useState<number>(year);
  const [targets, setTargets] = useState<WorkingHoursTarget[]>([]);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const appliedDefaultRef = useRef(false);

  useEffect(() => {
    fetchWorkingHoursTargets()
      .then(setTargets)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const url =
      debouncedYear > 0
        ? `/time/calendar_week?year=${debouncedYear}`
        : "/time/calendar_week";
    apiFetch<KWTime[]>(url)
      .then((json) => {
        setData(json);
        setLoading(false);
        if (
          !appliedDefaultRef.current &&
          Array.isArray(json) &&
          json.length > 0
        ) {
          appliedDefaultRef.current = true;
          onDefaultSelect?.(json[0].year, json[0].calendar_week);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        setLoading(false);
      });
  }, [debouncedYear, refreshKey]);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedYear(year);
    }, 500);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [year]);

  const columns = useMemo<ColumnDef<KWTime>[]>(() => {
    const cols: ColumnDef<KWTime>[] = [
      {
        accessorKey: "year",
        header: "Year",
      },
      {
        accessorKey: "calendar_week",
        header: "Week",
      },
      {
        accessorKey: "total_time",
        header: "Total time",
        cell: (info) => formatHours(Number(info.getValue())),
      },
      {
        id: "time_diff",
        accessorFn: (row) => {
          const target = weekTargetHours(
            targets,
            row?.year,
            row?.calendar_week,
          );
          return target === null ? null : Number(row?.total_time) - target;
        },
        header: "Difference",
        cell: (info) => {
          const row = info.row.original;
          const target = weekTargetHours(
            targets,
            row?.year,
            row?.calendar_week,
          );
          if (target === null) return "—";
          const diff = Number(row?.total_time) - target;
          return (
            <span
              className={cn(
                "font-semibold",
                diff >= 0
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-red-700 dark:text-red-400",
              )}
            >
              {formatSigned(diff)}
            </span>
          );
        },
      },
    ];

    // Safety net: the backend is expected to return only the known fields
    // above, but any unexpected extra field is still rendered as a plain
    // column (raw key as header, raw value as cell).
    if (data.length > 0) {
      const knownKeys = ["year", "calendar_week", "total_time"];
      for (const key of Object.keys(data[0])) {
        if (knownKeys.includes(key)) continue;
        cols.push({
          accessorKey: key as keyof KWTime,
          header: key,
          cell: (info) => info.getValue() as ReactNode,
        });
      }
    }

    return cols;
  }, [data, targets]);

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

  return (
    <Card>
      <CardHeader
        title="Calendar weeks"
        actions={
          <YearFilter
            value={year}
            onChange={onYearChange}
            onEnter={() => setDebouncedYear(year)}
          />
        }
      />
      <DataTable
        table={table}
        loading={loading}
        error={error}
        isRowSelected={(row) =>
          row.original.year === year &&
          row.original.calendar_week === calendarWeek
        }
        onRowClick={handleRowClick}
        emptyMessage="No data found."
      />
    </Card>
  );
}
