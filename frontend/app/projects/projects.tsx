"use client";

import {
  createColumnHelper,
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
import { Modal } from "../components/modal";
import { ConfirmDialog } from "../components/confirm-dialog";
import { PageHeader } from "../components/page-header";
import { Alert } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardHeader } from "../components/ui/card";
import { DataTable } from "../components/ui/data-table";
import { MultiSelect } from "../components/ui/multi-select";
import { Input, Select } from "../components/ui/input";
import { Field, FormFooter } from "../components/form";
import { budgetForScope, type ProjectBudget } from "../lib/budgets";
import { cn } from "../lib/cn";
import { fetchProjects, type Project } from "../lib/projects";
import { formatHours, formatSigned } from "../lib/format";

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
    header: () => "Project",
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
    header: () => "Total time",
    cell: (info) => formatHours(Number(info.getValue())),
  }),
];

const budgetColumnHelper = createColumnHelper<BudgetRow>();

export function Projects() {
  const searchParams = useSearchParams();
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedBudgetProjects, setSelectedBudgetProjects] = useState<
    string[]
  >([]);
  const [pendingUrlProject, setPendingUrlProject] = useState<string | null>(
    null,
  );
  const [year, setYear] = useState<number>(0);
  const [debouncedYear, setDebouncedYear] = useState<number>(0);
  const [data, setData] = useState<ProjectTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [budgetSorting, setBudgetSorting] = useState<SortingState>([]);
  const [budgets, setBudgets] = useState<ProjectBudget[]>([]);
  const [budgetsLoading, setBudgetsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [editingBudget, setEditingBudget] = useState<ProjectBudget | null>(
    null,
  );
  const [pendingBudgetDelete, setPendingBudgetDelete] =
    useState<ProjectBudget | null>(null);
  const [budgetProjectId, setBudgetProjectId] = useState<string>("");
  const [budgetHours, setBudgetHours] = useState<string>("");
  const [budgetYear, setBudgetYear] = useState<string>("");
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Remember the ?project=... name; it is resolved to an id below, once
  // the project list has loaded.
  useEffect(() => {
    const project = searchParams.get("project");
    if (project) setPendingUrlProject(project);
  }, [searchParams]);

  useEffect(() => {
    if (pendingUrlProject === null || projects.length === 0) return;
    const match = projects.find((p) => p.name === pendingUrlProject);
    if (match) setSelectedProjects([String(match.id)]);
    setPendingUrlProject(null);
  }, [projects, pendingUrlProject]);

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

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        value: String(project.id),
        label:
          project.project_nr !== null
            ? `${project.name} (${project.project_nr})`
            : project.name,
      })),
    [projects],
  );

  const filtered = useMemo(
    () =>
      selectedProjects.length === 0
        ? data
        : data.filter((project) =>
            selectedProjects.includes(String(project.project_id)),
          ),
    [data, selectedProjects],
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
          const row = info.row.original;
          const budget = budgetForScope(budgets, row.project_id, year);
          if (!budget) return "—";
          return (
            <Button
              variant="accent-soft"
              size="sm"
              onClick={() =>
                setSelectedBudgetProjects([String(row.project_id)])
              }
            >
              {formatHours(budget.time_budget_hours)}
            </Button>
          );
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
          return (
            <span
              className={cn(
                "font-semibold",
                diff > 0
                  ? "text-red-700 dark:text-red-400"
                  : "text-emerald-700 dark:text-emerald-400",
              )}
            >
              {formatSigned(diff)}
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
      budgets
        .map((budget) => ({
          ...budget,
          project_name:
            projects.find((project) => project.id === budget.project_id)
              ?.name ?? "Unknown project",
        }))
        .filter(
          (row) =>
            selectedBudgetProjects.length === 0 ||
            selectedBudgetProjects.includes(String(row.project_id)),
        ),
    [budgets, projects, selectedBudgetProjects],
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
        cell: (info) => formatHours(Number(info.getValue())),
      }),
      budgetColumnHelper.display({
        id: "actions",
        header: () => "",
        cell: (info) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEditBudget(info.row.original)}
              aria-label="Edit budget"
            >
              Edit
            </Button>
            <Button
              variant="danger-ghost"
              size="sm"
              onClick={() => setPendingBudgetDelete(info.row.original)}
              aria-label="Delete budget"
            >
              ×
            </Button>
          </div>
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

  const closeBudgetModal = () => {
    setBudgetProjectId("");
    setBudgetHours("");
    setBudgetYear("");
    setEditingBudget(null);
    setShowAddBudget(false);
  };

  const openEditBudget = (budget: ProjectBudget) => {
    setActionError(null);
    setEditingBudget(budget);
    setBudgetProjectId(String(budget.project_id));
    setBudgetHours(String(budget.time_budget_hours));
    setBudgetYear(budget.year === null ? "" : String(budget.year));
    setShowAddBudget(true);
  };

  const handleSubmitBudget = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (budgetProjectId === "" || budgetHours === "") return;
    setActionError(null);
    try {
      const url =
        editingBudget !== null
          ? `/projects/${budgetProjectId}/budget/${editingBudget.id}`
          : `/projects/${budgetProjectId}/budget`;
      await apiFetch<ProjectBudget>(url, {
        method: editingBudget !== null ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: budgetYear === "" ? null : Number(budgetYear),
          time_budget_hours: Number(budgetHours),
        }),
      });
      closeBudgetModal();
      loadBudgets();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : editingBudget !== null
            ? "Failed to update budget"
            : "Failed to add budget",
      );
    }
  };

  const deleteBudget = async (budget: ProjectBudget) => {
    setActionError(null);
    try {
      await apiFetch(`/projects/${budget.project_id}/budget/${budget.id}`, {
        method: "DELETE",
      });
      loadBudgets();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete budget",
      );
    }
  };

  return (
    <>
      {actionError !== null && <Alert className="mb-6">{actionError}</Alert>}
      <PageHeader
        title="Projects"
        description={`${projects.length} ${
          projects.length === 1 ? "project" : "projects"
        }`}
      />
      <Card>
        <CardHeader
          title="Project time"
          actions={
            <>
              <MultiSelect
                label="Project"
                options={projectOptions}
                selected={selectedProjects}
                onChange={setSelectedProjects}
              />
              <YearFilter value={year} onChange={setYear} />
            </>
          }
        />
        <DataTable
          table={table}
          loading={loading}
          error={error}
          emptyMessage={
            data.length === 0 ? "No data found." : "No projects match."
          }
        />
      </Card>
      <Card className="mt-6">
        <CardHeader
          title="Budgets"
          actions={
            <>
              <MultiSelect
                options={projectOptions}
                selected={selectedBudgetProjects}
                onChange={setSelectedBudgetProjects}
                placeholder="(all projects)"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setActionError(null);
                  setEditingBudget(null);
                  setBudgetProjectId("");
                  setBudgetHours("");
                  setBudgetYear("");
                  setShowAddBudget(true);
                }}
              >
                Add budget
              </Button>
            </>
          }
        />
        <DataTable
          table={budgetTable}
          loading={budgetsLoading}
          emptyMessage="No data found."
        />
      </Card>
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
        <Modal
          title={editingBudget !== null ? "Edit budget" : "Add budget"}
          onClose={closeBudgetModal}
        >
          <form onSubmit={handleSubmitBudget} className="flex flex-col gap-4">
            <Field id="budget-project-input" label="Project">
              <Select
                id="budget-project-input"
                value={budgetProjectId}
                onChange={(e) => setBudgetProjectId(e.target.value)}
                disabled={editingBudget !== null}
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
              </Select>
            </Field>
            <Field id="budget-hours-input" label="Hours">
              <Input
                id="budget-hours-input"
                type="number"
                min="1"
                placeholder="(hours)"
                value={budgetHours}
                onChange={(e) => setBudgetHours(e.target.value)}
              />
            </Field>
            <Field id="budget-year-input" label="Year">
              <Input
                id="budget-year-input"
                type="number"
                min="1"
                placeholder="(total)"
                value={budgetYear}
                onChange={(e) => setBudgetYear(e.target.value)}
              />
            </Field>
            <FormFooter
              onCancel={closeBudgetModal}
              submitLabel={editingBudget !== null ? "Save" : "Add budget"}
              submitDisabled={budgetProjectId === "" || budgetHours === ""}
            />
          </form>
        </Modal>
      )}
    </>
  );
}
