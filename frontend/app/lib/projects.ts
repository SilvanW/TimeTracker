import { apiFetch } from "./api";

export type Project = {
  id: number;
  name: string;
  project_nr: number | null;
};

export function fetchProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/projects/");
}
