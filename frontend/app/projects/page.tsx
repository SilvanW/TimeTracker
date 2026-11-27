import { Suspense } from "react";
import { Projects } from "./projects";

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="px-10 pt-3">Loading...</div>}>
      <Projects />
    </Suspense>
  );
}
