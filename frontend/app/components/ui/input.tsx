import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
} from "react";
import { cn } from "../../lib/cn";

export type InputSize = "sm" | "md";

const base =
  "w-full border border-line-strong bg-surface text-ink placeholder:text-ink-3 " +
  "transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 " +
  "disabled:opacity-60";

const sizes: Record<InputSize, string> = {
  sm: "h-8 rounded-md px-2.5 text-sm",
  md: "h-9 rounded-lg px-3 text-sm",
};

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: InputSize;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = "md", className, ...props },
  ref,
) {
  return (
    <input ref={ref} className={cn(base, sizes[size], className)} {...props} />
  );
});

export type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> & {
  size?: InputSize;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ size = "md", className, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(base, sizes[size], "pr-8", className)}
        {...props}
      />
    );
  },
);
