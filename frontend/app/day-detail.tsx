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
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { apiFetch } from "./lib/api";
import { Modal } from "./components/modal";
import { SortableHeader } from "./components/sortable-header";
import { fetchProjects, type Project } from "./lib/projects";

type TimeEntry = {
  id: number;
  project_id: number;
  start: string;
  end: string;
  description: string | null;
  total_time: number;
};

const columnHelper = createColumnHelper<TimeEntry>();

// "2026-03-04T09:15:00" -> "09:15"
function formatTime(value: string): string {
  return value.slice(11, 16);
}

type DayDetailProps = {
  year: number;
  dayOfYear: number;
  refreshKey: number;
  onEdited: () => void;
};

export function DayDetail({
  year,
  dayOfYear,
  refreshKey,
  onEdited,
}: DayDetailProps) {
  const [data, setData] = useState<TimeEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [debouncedParams, setDebouncedParams] = useState({ year, dayOfYear });
  const [projects, setProjects] = useState<Project[]>([]);
  const [editing, setEditing] = useState<TimeEntry | null>(null);
  const [editProjectId, setEditProjectId] = useState<string>("");
  const [editStart, setEditStart] = useState<string>("");
  const [editEnd, setEditEnd] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedParams((prev) =>
        prev.year === year && prev.dayOfYear === dayOfYear
          ? prev
          : { year, dayOfYear },
      );
    }, 500);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [year, dayOfYear]);

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setError(null);
    apiFetch<TimeEntry[]>(
      `/time/day?year=${debouncedParams.year}&day_of_year=${debouncedParams.dayOfYear}`,
    )
      .then((json) => setData(json))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to fetch data"),
      );
  }, [debouncedParams, refreshKey]);

  const openEdit = useCallback((entry: TimeEntry) => {
    setEditing(entry);
    setEditProjectId(String(entry.project_id));
    setEditStart(entry.start.slice(0, 16));
    setEditEnd(entry.end.slice(0, 16));
    setEditDescription(entry.description ?? "");
  }, []);

  const closeEdit = () => {
    setEditing(null);
    setEditProjectId("");
    setEditStart("");
    setEditEnd("");
    setEditDescription("");
  };

  const canSubmitEdit =
    editing !== null &&
    editProjectId !== "" &&
    editStart !== "" &&
    editEnd !== "" &&
    editEnd > editStart;

  const editTimeWorked =
    editStart !== "" && editEnd !== "" && editEnd > editStart
      ? (new Date(editEnd).getTime() - new Date(editStart).getTime()) / 3600000
      : null;

  const handleSubmitEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmitEdit || editing === null) return;
    try {
      await apiFetch(`/time/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: Number(editProjectId),
          start: editStart,
          end: editEnd,
          description: editDescription === "" ? null : editDescription,
        }),
      });
      closeEdit();
      onEdited();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update time");
    }
  };

  const columns = useMemo<ColumnDef<TimeEntry, any>[]>(
    () => [
      columnHelper.accessor("start", {
        header: () => "Start",
        cell: (info) => formatTime(info.getValue()),
      }),
      columnHelper.accessor("end", {
        header: () => "End",
        cell: (info) => formatTime(info.getValue()),
      }),
      columnHelper.accessor("total_time", {
        header: () => "Time Worked",
        cell: (info) => {
          const value = Number(info.getValue());
          return isNaN(value) ? "" : value.toFixed(2);
        },
      }),
      columnHelper.accessor("description", {
        header: () => "Description",
        cell: (info) => {
          const value = info.getValue();
          return value === null || value === undefined ? "—" : value;
        },
      }),
      columnHelper.display({
        id: "actions",
        header: () => "",
        cell: (info) => (
          <button
            type="button"
            onClick={() => openEdit(info.row.original)}
            aria-label="Edit time entry"
            className="rounded bg-blue-50 border border-blue-200 px-3 py-1 font-medium text-blue-700 transition hover:bg-blue-100"
          >
            Edit
          </button>
        ),
      }),
    ],
    [openEdit],
  );

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
      <div
        className="overflow-x-auto overflow-y-auto rounded-lg shadow border border-zinc-200 bg-white"
        style={{ maxHeight: "60vh" }}
      >
        {error ? (
          <div className="p-8 text-center rounded-lg border border-red-200 bg-red-50 text-red-700 text-lg font-medium">
            {error}
          </div>
        ) : data.length === 0 ? (
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
      {editing !== null && (
        <Modal title="Edit time" onClose={closeEdit}>
          <form onSubmit={handleSubmitEdit} className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <label
                htmlFor="edit-project-input"
                className="font-medium text-zinc-700"
              >
                Project:
              </label>
              <select
                id="edit-project-input"
                value={editProjectId}
                onChange={(e) => setEditProjectId(e.target.value)}
                className="border border-zinc-300 rounded px-3 py-1 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                    {project.project_nr !== null
                      ? ` (${project.project_nr})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label
                htmlFor="edit-start-input"
                className="font-medium text-zinc-700"
              >
                Start:
              </label>
              <input
                id="edit-start-input"
                type="datetime-local"
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
                className="border border-zinc-300 rounded px-3 py-1 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex items-center gap-4">
              <label
                htmlFor="edit-end-input"
                className="font-medium text-zinc-700"
              >
                End:
              </label>
              <input
                id="edit-end-input"
                type="datetime-local"
                value={editEnd}
                onChange={(e) => setEditEnd(e.target.value)}
                className="border border-zinc-300 rounded px-3 py-1 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            {editTimeWorked !== null && (
              <p className="text-sm text-zinc-600">
                Time worked: {editTimeWorked.toFixed(2)} h
              </p>
            )}
            <div className="flex items-center gap-4">
              <label
                htmlFor="edit-description-input"
                className="font-medium text-zinc-700"
              >
                Description:
              </label>
              <input
                id="edit-description-input"
                type="text"
                placeholder="(optional)"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="border border-zinc-300 rounded px-3 py-1 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-200 w-48"
              />
            </div>
            <div className="mt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEdit}
                className="rounded border border-zinc-300 bg-white px-3 py-1 font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmitEdit}
                className="rounded bg-blue-500 px-3 py-1 font-medium text-white transition hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
