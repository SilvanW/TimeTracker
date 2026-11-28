"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn";
import { Input } from "./input";

export type MultiSelectOption = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  label?: string;
  placeholder?: string;
};

// Searchable multi-select (project filters). The dropdown is portaled to
// <body> and fixed-positioned from the trigger's rect — the cards'
// overflow-hidden would clip an in-place dropdown.
export function MultiSelect({
  options,
  selected,
  onChange,
  label,
  placeholder = "(all)",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [panel, setPanel] = useState<{
    top: number;
    right: number;
    width: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query]);

  const selectedLabels = options
    .filter((option) => selected.includes(option.value))
    .map((option) => option.label);
  const summary =
    selected.length === 0
      ? placeholder
      : selectedLabels.slice(0, 2).join(", ") +
        (selectedLabels.length > 2 ? ` +${selectedLabels.length - 2}` : "");

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPanel({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
      width: Math.min(Math.max(rect.width, 240), rect.right - 8),
    });
    setQuery("");
    setActiveIndex(-1);
    setOpen(true);
  };

  const toggleOption = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  };

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  // While open: close on Escape, outside mousedown, or any scroll/resize
  // (the panel is fixed-positioned, so the page moving under it desyncs it).
  // Scrolls originating inside the panel itself are ignored.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onScroll = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  const onSearchKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, visible.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const option = visible[activeIndex];
      if (option) toggleOption(option.value);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {label ? <span className="text-sm text-ink-2">{label}</span> : null}
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex h-8 w-44 items-center gap-2 rounded-md border border-line-strong bg-surface px-2.5 text-sm text-ink transition-colors hover:bg-surface-2"
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-left",
              selected.length === 0 && "text-ink-3",
            )}
          >
            {summary}
          </span>
          {selected.length === 0 && (
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5 shrink-0 text-ink-3"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          )}
        </button>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            aria-label="Clear selection"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-3.5 w-3.5"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>
      {open &&
        panel !== null &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            aria-multiselectable="true"
            className="fixed z-50 overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
            style={{ top: panel.top, right: panel.right, width: panel.width }}
          >
            <div className="border-b border-line p-2">
              <Input
                ref={searchRef}
                size="sm"
                type="text"
                placeholder="Search…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(-1);
                }}
                onKeyDown={onSearchKeyDown}
              />
            </div>
            <ul className="max-h-64 overflow-y-auto py-1">
              {visible.length === 0 ? (
                <li className="px-3 py-2 text-sm text-ink-3">No matches</li>
              ) : (
                visible.map((option, index) => {
                  const isSelected = selected.includes(option.value);
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => toggleOption(option.value)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors",
                          index === activeIndex && "bg-surface-2",
                          isSelected ? "text-ink" : "text-ink-2",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border",
                            isSelected
                              ? "border-accent bg-accent text-white"
                              : "border-line-strong bg-surface",
                          )}
                        >
                          {isSelected && (
                            <svg
                              aria-hidden
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-2.5 w-2.5"
                            >
                              <path d="m5 12 5 5L20 7" />
                            </svg>
                          )}
                        </span>
                        <span className="truncate">{option.label}</span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
