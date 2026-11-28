import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type ButtonVariant =
  "primary" | "outline" | "ghost" | "danger" | "danger-ghost" | "accent-soft";

export type ButtonSize = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium " +
  "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
  "disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white shadow-sm hover:bg-accent-hover",
  outline: "border border-line-strong bg-surface text-ink hover:bg-surface-2",
  ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-500",
  "danger-ghost":
    "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10",
  "accent-soft":
    "border border-accent-soft-border bg-accent-soft text-accent-ink hover:opacity-80",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 rounded-md px-2.5 text-sm",
  md: "h-9 rounded-lg px-3.5 text-sm",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "outline", size = "md", className, type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  },
);
