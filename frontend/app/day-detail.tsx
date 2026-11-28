"use client";

import {
  createColumnHelper,
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
import { Field, FormFooter } from "./components/form";
import { Button } from "./components/ui/button";
import { Card, CardHeader } from "./components/ui/card";
import { DataTable } from "./components/ui/data-table";
import { Input, Select } from "./components/ui/input";
import { formatHours } from "./lib/format";
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
        header: () => "Time worked",
        cell: (info) => formatHours(Number(info.getValue())),
      }),
      columnHelper.accessor("description", {
        header: () => "Description",
        cell: (info) => {
          const value = info.getValue();
          return value === null || value === undefined ? (
            "—"
          ) : (
            <span title={value} className="block max-w-xs truncate">
              {value}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: () => "",
        cell: (info) => (
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => openEdit(info.row.original)}
            aria-label="Edit time entry"
          >
            Edit
          </Button>
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
      <Card>
        <CardHeader title="Day detail" />
        <DataTable table={table} error={error} emptyMessage="No data found." />
      </Card>
      {editing !== null && (
        <Modal title="Edit time" onClose={closeEdit}>
          <form onSubmit={handleSubmitEdit} className="flex flex-col gap-4">
            <Field id="edit-project-input" label="Project">
              <Select
                id="edit-project-input"
                value={editProjectId}
                onChange={(e) => setEditProjectId(e.target.value)}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                    {project.project_nr !== null
                      ? ` (${project.project_nr})`
                      : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="edit-start-input" label="Start">
              <Input
                id="edit-start-input"
                type="datetime-local"
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
              />
            </Field>
            <Field
              id="edit-end-input"
              label="End"
              hint={
                editTimeWorked !== null
                  ? `Time worked: ${editTimeWorked.toFixed(2)} h`
                  : undefined
              }
            >
              <Input
                id="edit-end-input"
                type="datetime-local"
                value={editEnd}
                onChange={(e) => setEditEnd(e.target.value)}
              />
            </Field>
            <Field id="edit-description-input" label="Description">
              <Input
                id="edit-description-input"
                type="text"
                placeholder="(optional)"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </Field>
            <FormFooter
              onCancel={closeEdit}
              submitLabel="Save"
              submitDisabled={!canSubmitEdit}
            />
          </form>
        </Modal>
      )}
    </div>
  );
}
