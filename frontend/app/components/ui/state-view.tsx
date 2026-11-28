import { cn } from "../../lib/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-transparent",
        className,
      )}
    />
  );
}

export function LoadingView({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-sm text-ink-2">
      <Spinner />
      {label}
    </div>
  );
}

export function ErrorView({ message }: { message: string }) {
  return (
    <div className="px-4 py-12 text-center text-sm font-medium text-red-600 dark:text-red-400">
      {message}
    </div>
  );
}

export function EmptyView({
  message = "No data found.",
}: {
  message?: string;
}) {
  return <div className="px-4 py-12 text-center text-sm text-ink-3">{message}</div>;
}
