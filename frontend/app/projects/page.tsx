import { Suspense } from "react";
import { Projects } from "./projects";

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-ink-2">Loading…</div>
      }
    >
      <Projects />
    </Suspense>
  );
}
