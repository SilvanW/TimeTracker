"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../lib/api";
import { YearFilter } from "../components/input";

type ProjectTime = {
  project_name: string;
  total_time: number;
};

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

export function Projects() {
  const searchParams = useSearchParams();
  const [nameFilter, setNameFilter] = useState<string>("");
  const [year, setYear] = useState<number>(0);
  const [debouncedYear, setDebouncedYear] = useState<number>(0);
  const [data, setData] = useState<ProjectTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Prefill the name filter when arriving via /projects?project=...
  useEffect(() => {
    const project = searchParams.get("project");
    if (project) setNameFilter(project);
  }, [searchParams]);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedYear(year);
    }, 500);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [year]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const url =
      debouncedYear > 0
        ? `/time/project?year=${debouncedYear}`
        : "/time/project";
    apiFetch<ProjectTime[]>(url)
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        setLoading(false);
      });
  }, [debouncedYear]);

  const filtered = useMemo(
    () =>
      data.filter((project) =>
        project.project_name
          .toLowerCase()
          .includes(nameFilter.trim().toLowerCase()),
      ),
    [data, nameFilter],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <main className="px-10 pt-1">
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-4">
          <label htmlFor="project-input" className="font-medium text-zinc-700">
            Project:
          </label>
          <div className="relative">
            <input
              id="project-input"
              type="text"
              placeholder="(all)"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="border border-zinc-300 rounded px-3 py-1 pr-8 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-200 w-48"
            />
            {nameFilter !== "" && (
              <button
                type="button"
                onClick={() => setNameFilter("")}
                aria-label="Clear project filter"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-700"
              >
                ×
              </button>
            )}
          </div>
        </div>
        <YearFilter value={year} onChange={setYear} />
      </div>
      <div
        className="overflow-x-auto overflow-y-auto rounded-lg shadow border border-zinc-200 bg-white"
        style={{ maxHeight: "60vh" }}
      >
        {loading ? (
          <div className="p-8 text-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 text-lg font-medium shadow">
            Loading...
          </div>
        ) : error ? (
          <div className="p-8 text-center rounded-lg border border-red-200 bg-red-50 text-red-700 text-lg font-medium">
            {error}
          </div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 text-lg font-medium shadow">
            No data found.
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 text-lg font-medium shadow">
            No projects match.
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
    </main>
  );
}
