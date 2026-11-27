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
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { apiFetch } from "../lib/api";
import { YearFilter } from "../components/input";
import { SortableHeader } from "../components/sortable-header";
import { Modal } from "../components/modal";
import { ConfirmDialog } from "../components/confirm-dialog";
import { budgetForScope, type ProjectBudget } from "../lib/budgets";
import { fetchProjects, type Project } from "../lib/projects";

type ProjectTime = {
  project_id: number;
  project_name: string;
  project_nr: number | null;
  total_time: number;
};

type BudgetRow = ProjectBudget & {
  project_name: string;
};

const columnHelper = createColumnHelper<ProjectTime>();

const baseColumns = [
  columnHelper.accessor("project_name", {
    header: () => "Project Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("project_nr", {
    header: () => "Project Number",
    cell: (info) => {
      const value = info.getValue();
      return value === null || value === undefined ? "—" : value;
    },
  }),
  columnHelper.accessor("total_time", {
    header: () => "Total Time",
    cell: (info) => {
      const value = Number(info.getValue());
      return isNaN(value) ? "" : value.toFixed(2);
    },
  }),
];

const budgetColumnHelper = createColumnHelper<BudgetRow>();

export function Projects() {
  const searchParams = useSearchParams();
  const [nameFilter, setNameFilter] = useState<string>("");
  const [year, setYear] = useState<number>(0);
  const [debouncedYear, setDebouncedYear] = useState<number>(0);
  const [data, setData] = useState<ProjectTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [budgetSorting, setBudgetSorting] = useState<SortingState>([]);
  const [budgets, setBudgets] = useState<ProjectBudget[]>([]);
  const [budgetsLoading, setBudgetsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [pendingBudgetDelete, setPendingBudgetDelete] =
    useState<ProjectBudget | null>(null);
  const [budgetProjectId, setBudgetProjectId] = useState<string>("");
  const [budgetHours, setBudgetHours] = useState<string>("");
  const [budgetYear, setBudgetYear] = useState<string>("");
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Prefill the name filter when arriving via /projects?project=...
  useEffect(() => {
    const project = searchParams.get("project");
    if (project) setNameFilter(project);
  }, [searchParams]);

  const loadBudgets = useCallback(() => {
    setBudgetsLoading(true);
    apiFetch<ProjectBudget[]>("/projects/budgets")
      .then((json) => {
        setBudgets(json);
        setBudgetsLoading(false);
      })
      .catch(() => setBudgetsLoading(false));
  }, []);

  useEffect(() => {
    loadBudgets();
    fetchProjects()
      .then(setProjects)
      .catch(() => {});
  }, [loadBudgets]);

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

  const columns = useMemo<ColumnDef<ProjectTime, any>[]>(
    () => [
      ...baseColumns,
      {
        id: "budget",
        accessorFn: (row: ProjectTime) =>
          budgetForScope(budgets, row.project_id, year)?.time_budget_hours ??
          null,
        header: () => "Budget",
        cell: (info) => {
          const budget = budgetForScope(
            budgets,
            info.row.original.project_id,
            year,
          );
          return budget ? budget.time_budget_hours : "—";
        },
      },
      {
        id: "difference",
        accessorFn: (row: ProjectTime) => {
          const budget = budgetForScope(budgets, row.project_id, year);
          return budget
            ? Number(row.total_time) - budget.time_budget_hours
            : null;
        },
        header: () => "Difference",
        cell: (info) => {
          const row = info.row.original;
          const budget = budgetForScope(budgets, row.project_id, year);
          if (!budget) return "—";
          const diff = Number(row.total_time) - budget.time_budget_hours;
          const over = diff > 0;
          return (
            <span
              className={`px-3 py-1 rounded font-semibold text-white ${
                over ? "bg-red-500" : "bg-green-500"
              }`}
            >
              {over ? "+" : ""}
              {diff.toFixed(2)}
            </span>
          );
        },
      },
    ],
    [budgets, year],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const budgetRows = useMemo<BudgetRow[]>(
    () =>
      budgets.map((budget) => ({
        ...budget,
        project_name:
          projects.find((project) => project.id === budget.project_id)?.name ??
          "Unknown project",
      })),
    [budgets, projects],
  );

  const budgetColumns = useMemo(
    () => [
      budgetColumnHelper.accessor("project_name", {
        header: () => "Project",
        cell: (info) => info.getValue(),
      }),
      budgetColumnHelper.accessor("year", {
        header: () => "Year",
        cell: (info) => (info.getValue() === null ? "Total" : info.getValue()),
      }),
      budgetColumnHelper.accessor("time_budget_hours", {
        header: () => "Budget (h)",
        cell: (info) => info.getValue(),
      }),
      budgetColumnHelper.display({
        id: "delete",
        header: () => "",
        cell: (info) => (
          <button
            type="button"
            onClick={() => setPendingBudgetDelete(info.row.original)}
            aria-label="Delete budget"
            className="rounded bg-red-50 border border-red-200 px-3 py-1 font-medium text-red-700 transition hover:bg-red-100"
          >
            ×
          </button>
        ),
      }),
    ],
    [],
  );

  const budgetTable = useReactTable({
    data: budgetRows,
    columns: budgetColumns,
    state: { sorting: budgetSorting },
    onSortingChange: setBudgetSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleSubmitBudget = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (budgetProjectId === "" || budgetHours === "") return;
    try {
      await apiFetch<ProjectBudget>(`/projects/${budgetProjectId}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: budgetYear === "" ? null : Number(budgetYear),
          time_budget_hours: Number(budgetHours),
        }),
      });
      setBudgetProjectId("");
      setBudgetHours("");
      setBudgetYear("");
      setShowAddBudget(false);
      loadBudgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add budget");
    }
  };

  const deleteBudget = async (budget: ProjectBudget) => {
    try {
      await apiFetch(`/projects/${budget.project_id}/budget/${budget.id}`, {
        method: "DELETE",
      });
      loadBudgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete budget");
    }
  };

  return (
    <main className="px-10 pt-3">
      <div className="mb-3 flex items-center gap-4">
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
      <div className="mt-8 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-medium text-zinc-700">Budgets</h2>
        <button
          type="button"
          onClick={() => {
            setBudgetProjectId("");
            setBudgetHours("");
            setBudgetYear("");
            setShowAddBudget(true);
          }}
          className="rounded bg-blue-50 border border-blue-200 px-3 py-1 font-medium text-blue-700 transition hover:bg-blue-100"
        >
          Add budget
        </button>
      </div>
      <div
        className="overflow-x-auto overflow-y-auto rounded-lg shadow border border-zinc-200 bg-white"
        style={{ maxHeight: "60vh" }}
      >
        {budgetsLoading ? (
          <div className="p-8 text-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 text-lg font-medium shadow">
            Loading...
          </div>
        ) : budgetRows.length === 0 ? (
          <div className="p-8 text-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 text-lg font-medium shadow">
            No data found.
          </div>
        ) : (
          <table className="w-full text-sm text-zinc-800">
            <thead className="bg-zinc-100 sticky top-0 z-10">
              {budgetTable.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <SortableHeader key={header.id} header={header} />
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {budgetTable.getRowModel().rows.map((row) => (
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
      {pendingBudgetDelete !== null && (
        <ConfirmDialog
          title="Delete budget"
          message={`Delete budget of ${pendingBudgetDelete.time_budget_hours}h for ${
            projects.find((p) => p.id === pendingBudgetDelete.project_id)
              ?.name ?? "unknown project"
          } (${
            pendingBudgetDelete.year === null
              ? "total"
              : pendingBudgetDelete.year
          })?`}
          onConfirm={() => {
            const budget = pendingBudgetDelete;
            setPendingBudgetDelete(null);
            void deleteBudget(budget);
          }}
          onCancel={() => setPendingBudgetDelete(null)}
        />
      )}
      {showAddBudget && (
        <Modal title="Add budget" onClose={() => setShowAddBudget(false)}>
          <form onSubmit={handleSubmitBudget} className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <label
                htmlFor="budget-project-input"
                className="font-medium text-zinc-700"
              >
                Project:
              </label>
              <select
                id="budget-project-input"
                value={budgetProjectId}
                onChange={(e) => setBudgetProjectId(e.target.value)}
                className="border border-zinc-300 rounded px-3 py-1 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">(select)</option>
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
                htmlFor="budget-hours-input"
                className="font-medium text-zinc-700"
              >
                Hours:
              </label>
              <input
                id="budget-hours-input"
                type="number"
                min="1"
                placeholder="(hours)"
                value={budgetHours}
                onChange={(e) => setBudgetHours(e.target.value)}
                className="border border-zinc-300 rounded px-3 py-1 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-200 w-28"
              />
            </div>
            <div className="flex items-center gap-4">
              <label
                htmlFor="budget-year-input"
                className="font-medium text-zinc-700"
              >
                Year:
              </label>
              <input
                id="budget-year-input"
                type="number"
                min="1"
                placeholder="(total)"
                value={budgetYear}
                onChange={(e) => setBudgetYear(e.target.value)}
                className="border border-zinc-300 rounded px-3 py-1 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-200 w-28"
              />
            </div>
            <div className="mt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddBudget(false)}
                className="rounded border border-zinc-300 bg-white px-3 py-1 font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={budgetProjectId === "" || budgetHours === ""}
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
