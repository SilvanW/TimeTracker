import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export type BadgeTone = "neutral" | "accent" | "success" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "border-line bg-surface-2 text-ink-2",
  accent: "border-accent-soft-border bg-accent-soft text-accent-ink",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400",
  danger:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400",
};

// Small labelled value chip (e.g. +1.25 / -0.50 differences).
export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
