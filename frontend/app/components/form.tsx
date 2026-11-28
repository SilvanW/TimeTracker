import type { ReactNode } from "react";
import { Button } from "./ui/button";

// Label above its control — the single form-field layout used by all modals.
export function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-2">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-ink-3">{hint}</p> : null}
    </div>
  );
}

// Consistent modal footer: Cancel (ghost) + primary submit.
export function FormFooter({
  onCancel,
  submitLabel = "Save",
  submitDisabled = false,
}: {
  onCancel: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
}) {
  return (
    <div className="mt-2 flex justify-end gap-2">
      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" variant="primary" disabled={submitDisabled}>
        {submitLabel}
      </Button>
    </div>
  );
}
