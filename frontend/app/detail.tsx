"use client";

import Link from "next/link";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "./lib/api";
import { Card, CardHeader } from "./components/ui/card";
import { DataTable } from "./components/ui/data-table";
import { formatHours } from "./lib/format";

type ProjectTime = {
  project_name: string;
  total_time: number;
};

const columnHelper = createColumnHelper<ProjectTime>();

const columns = [
  columnHelper.accessor("project_name", {
    header: () => "Project",
    cell: (info) => (
      <Link
        href={`/projects?project=${encodeURIComponent(info.getValue())}`}
        className="inline-flex items-center gap-1 rounded-md border border-accent-soft-border bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-ink transition-colors hover:opacity-80 hover:underline"
      >
        {info.getValue()}
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3 w-3"
        >
          <path d="M7 7h10v10" />
          <path d="M7 17 17 7" />
        </svg>
      </Link>
    ),
  }),
  columnHelper.accessor("total_time", {
    header: () => "Total time",
    cell: (info) => formatHours(Number(info.getValue())),
  }),
];

type DetailProps = {
  year: number;
  calendarWeek: number;
  refreshKey: number;
};

export function Detail({ year, calendarWeek, refreshKey }: DetailProps) {
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
  }, [debouncedParams, refreshKey]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full">
      <Card>
        <CardHeader title="Time by project" />
        <DataTable table={table} error={error} emptyMessage="No data found." />
      </Card>
    </div>
  );
}
