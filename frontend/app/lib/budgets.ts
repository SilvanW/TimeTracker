import { apiFetch } from "./api";

export type ProjectBudget = {
  id: number;
  project_id: number;
  // null = total budget across all years
  year: number | null;
  time_budget_hours: number;
  budget_source: string | null;
};

export function fetchProjectBudgets(): Promise<ProjectBudget[]> {
  return apiFetch<ProjectBudget[]>("/projects/budgets");
}

// Budget that applies for `year` (0 = all years -> the total budget, i.e. the
// row with a null year), or null when none is defined.
export function budgetForScope(
  budgets: ProjectBudget[],
  projectId: number,
  year: number,
): ProjectBudget | null {
  const budget = budgets.find(
    (b) =>
      b.project_id === projectId &&
      (year === 0 ? b.year === null : b.year === year),
  );
  return budget ?? null;
}
