import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

// Inline page-level message (form errors etc.).
export function Alert({
  tone = "danger",
  className,
  children,
}: {
  tone?: "danger" | "info";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border px-4 py-2.5 text-sm",
        tone === "danger"
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400"
          : "border-accent-soft-border bg-accent-soft text-accent-ink",
        className,
      )}
    >
      {children}
    </div>
  );
}
