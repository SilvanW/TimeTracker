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
import { Modal } from "../components/modal";
import { FULL_WEEK_HOURS, type WorkingHoursTarget } from "../lib/targets";

const columnHelper = createColumnHelper<WorkingHoursTarget>();

// Local date as YYYY-MM-DD (date input defaults; ToISOString is UTC, so
// shift by the timezone offset first).
function todayIsoDate(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

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
  const [showAdd, setShowAdd] = useState(false);

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
      setShowAdd(false);
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
          className="rounded bg-red-50 border border-red-200 px-3 py-1 font-medium text-red-700 transition hover:bg-red-100"
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
    <main className="px-10 pt-3">
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setEffectiveDate(todayIsoDate());
            setPercentage("");
            setShowAdd(true);
          }}
          className="rounded bg-blue-50 border border-blue-200 px-3 py-1 font-medium text-blue-700 transition hover:bg-blue-100"
        >
          Add
        </button>
      </div>
      {error ? (
        <div className="mb-3 p-4 text-center rounded-lg border border-red-200 bg-red-50 text-red-700 text-lg font-medium">
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
      {showAdd && (
        <Modal title="Add working hours" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <div className="mt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded border border-zinc-300 bg-white px-3 py-1 font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={effectiveDate === "" || percentage === ""}
                className="rounded bg-blue-500 px-3 py-1 font-medium text-white transition hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
