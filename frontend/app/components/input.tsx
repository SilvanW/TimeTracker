"use client";

import { useId } from "react";
import { Input } from "./ui/input";

type YearFilterProps = {
  value: number;
  onChange: (value: number) => void;
  onEnter?: () => void;
  label?: string;
};

export function YearFilter({
  value,
  onChange,
  onEnter,
  label = "Year",
}: YearFilterProps) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm text-ink-2">
        {label}
      </label>
      <Input
        id={id}
        size="sm"
        type="number"
        min="0"
        placeholder="(all)"
        value={value === 0 ? "" : value}
        onChange={(e) => {
          const val = e.target.value;
          if (val === "" || (/^\d+$/.test(val) && Number(val) >= 0)) {
            onChange(Number(val));
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) onEnter();
        }}
        className="w-24"
      />
    </div>
  );
}
