"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "../lib/api";
import { SortableHeader } from "../components/sortable-header";
import { ConfirmDialog } from "../components/confirm-dialog";
import { FULL_WEEK_HOURS, type WorkingHoursTarget } from "../lib/targets";

const columnHelper = createColumnHelper<WorkingHoursTarget>();

export default function WorkingHoursPage() {
  const [targets, setTargets] = useState<WorkingHoursTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [effectiveDate, setEffectiveDate] = useState("");
  const [percentage, setPercentage] = useState("");
  const [pendingDelete, setPendingDelete] = useState<WorkingHoursTarget | null>(
    null,
  );

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch<WorkingHoursTarget[]>("/working_hours/")
      .then((json) => {
        setTargets(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (effectiveDate === "" || percentage === "") return;
    try {
      await apiFetch<WorkingHoursTarget>("/working_hours/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          effective_date: effectiveDate,
          percentage: Number(percentage),
        }),
      });
      setEffectiveDate("");
      setPercentage("");
      load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add working hours",
      );
    }
  };

  const deleteTarget = async (target: WorkingHoursTarget) => {
    try {
      await apiFetch(`/working_hours/${target.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete working hours",
      );
    }
  };

  const columns = [
    columnHelper.accessor("effective_date", {
      header: () => "Effective Date",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("percentage", {
      header: () => "Percentage",
      cell: (info) => `${info.getValue()}%`,
    }),
    columnHelper.accessor("percentage", {
      id: "weekly_hours",
      header: () => "Hours / Week",
      cell: (info) =>
        ((FULL_WEEK_HOURS * Number(info.getValue())) / 100).toFixed(2),
    }),
    columnHelper.display({
      id: "delete",
      header: () => "",
      cell: (info) => (
        <button
          type="button"
          onClick={() => setPendingDelete(info.row.original)}
          aria-label="Delete working hours"
          className="text-zinc-400 transition hover:text-zinc-700"
        >
          ×
        </button>
      ),
    }),
  ];

  const table = useReactTable({
    data: targets,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <main className="px-10 pt-1">
      <form onSubmit={handleSubmit} className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-4">
          <label
            htmlFor="effective-date-input"
            className="font-medium text-zinc-700"
          >
            Effective from:
          </label>
          <input
            id="effective-date-input"
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            className="border border-zinc-300 rounded px-3 py-1 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="flex items-center gap-4">
          <label
            htmlFor="percentage-input"
            className="font-medium text-zinc-700"
          >
            Percentage:
          </label>
          <input
            id="percentage-input"
            type="number"
            min="0"
            max="100"
            placeholder="(0–100)"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            className="border border-zinc-300 rounded px-3 py-1 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-200 w-28"
          />
        </div>
        <button
          type="submit"
          disabled={effectiveDate === "" || percentage === ""}
          className="rounded bg-blue-50 border border-blue-200 px-3 py-1 font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </form>
      {error ? (
        <div className="mb-4 p-4 text-center rounded-lg border border-red-200 bg-red-50 text-red-700 text-lg font-medium">
          {error}
        </div>
      ) : (
        <div
          className="overflow-x-auto overflow-y-auto rounded-lg shadow border border-zinc-200 bg-white"
          style={{ maxHeight: "60vh" }}
        >
          {loading ? (
            <div className="p-8 text-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 text-lg font-medium shadow">
              Loading...
            </div>
          ) : targets.length === 0 ? (
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
      )}
      {pendingDelete !== null && (
        <ConfirmDialog
          title="Delete working hours"
          message={`Delete working hours from ${pendingDelete.effective_date} (${pendingDelete.percentage}%)?`}
          onConfirm={() => {
            const target = pendingDelete;
            setPendingDelete(null);
            void deleteTarget(target);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </main>
  );
}
